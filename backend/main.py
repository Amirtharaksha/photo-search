import os
import uuid
import shutil
import hashlib
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
from jose import jwt, JWTError

import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPModel
import chromadb
import numpy as np

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
JWT_SECRET = os.getenv("JWT_SECRET")

app = FastAPI(title="PhotoSearch API v2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

print("Loading CLIP model...")
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
clip_model.eval()
print("CLIP model loaded.")

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="photos_v2",
    metadata={"hnsw:space": "cosine"}
)

# In-memory store (replace with Supabase DB calls in production)
photos_db = {}      # photo_id -> photo dict
albums_db = {}      # album_id -> album dict
shares_db = {}      # token -> photo_id
faces_db = {}       # face_group_id -> [photo_ids]


# ─── Auth ────────────────────────────────────────────────────────────────────

import httpx
from jose import jwt, jwk
from jose.utils import base64url_decode
import json

_jwks_cache = None

async def get_jwks():
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json")
        _jwks_cache = res.json()
    return _jwks_cache

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    try:
        # First try legacy HS256 with JWT secret
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        email = payload.get("email", "")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "email": email}
    except JWTError:
        pass

    try:
        # Try ECC P-256 using Supabase JWKS
        import urllib.request
        jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
        with urllib.request.urlopen(jwks_url) as response:
            jwks = json.loads(response.read())

        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        # Find matching key
        key = None
        for k in jwks.get("keys", []):
            if k.get("kid") == kid:
                key = k
                break

        if not key:
            key = jwks["keys"][0]

        public_key = jwk.construct(key)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["ES256", "RS256"],
            options={"verify_aud": False}
        )
        user_id = payload.get("sub")
        email = payload.get("email", "")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id, "email": email}
    except Exception as e:
        print(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")


def get_image_embedding(image_path: str) -> List[float]:
    image = Image.open(image_path).convert("RGB")
    inputs = clip_processor(images=image, return_tensors="pt", padding=True)
    with torch.no_grad():
        features = clip_model.get_image_features(**inputs)
    emb = features[0].numpy()
    emb = emb / np.linalg.norm(emb)
    return emb.tolist()


def get_text_embedding(text: str) -> List[float]:
    inputs = clip_processor(text=[text], return_tensors="pt", padding=True)
    with torch.no_grad():
        features = clip_model.get_text_features(**inputs)
    emb = features[0].numpy()
    emb = emb / np.linalg.norm(emb)
    return emb.tolist()



def detect_faces(image_path: str) -> List[List[float]]:
    """Return face embeddings using DeepFace (no C++ compiler needed)."""
    try:
        from deepface import DeepFace
        result = DeepFace.represent(
            img_path=image_path,
            model_name="Facenet",
            enforce_detection=False
        )
        return [r["embedding"] for r in result if r.get("face_confidence", 0) > 0.7]
    except Exception:
        return []


def assign_face_groups(photo_id: str, face_encodings: List[List[float]], user_id: str):
    """Cluster faces into groups by comparing with existing groups."""
    try:
        threshold = 10.0
        for enc in face_encodings:
            enc_arr = np.array(enc)
            matched_group = None
            for gid, group in faces_db.items():
                if group["user_id"] != user_id:
                    continue
                for ref_enc in group["encodings"][:5]:
                    dist = float(np.linalg.norm(enc_arr - np.array(ref_enc)))
                    if dist < threshold:
                        matched_group = gid
                        break
                if matched_group:
                    break
            if matched_group:
                faces_db[matched_group]["photo_ids"].append(photo_id)
                faces_db[matched_group]["encodings"].append(enc)
            else:
                gid = str(__import__('uuid').uuid4())
                faces_db[gid] = {
                    "id": gid,
                    "user_id": user_id,
                    "photo_ids": [photo_id],
                    "encodings": [enc],
                    "name": None,
                    "cover_photo_id": photo_id,
                }
    except Exception as e:
        print(f"Face grouping error: {e}")



# ─── Models ──────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    limit: int = 20

class AlbumCreate(BaseModel):
    name: str

class AlbumAddPhoto(BaseModel):
    photo_id: str

class FaceGroupName(BaseModel):
    name: str


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "PhotoSearch API v2"}


# ── Upload ──

@app.post("/upload")
async def upload_photos(
    files: List[UploadFile] = File(...),
    user: dict = Depends(get_current_user)
):
    uploaded, errors = [], []
    user_id = user["id"]

    for file in files:
        if not file.content_type.startswith("image/"):
            errors.append(f"{file.filename}: not an image")
            continue

        photo_id = str(uuid.uuid4())
        ext = Path(file.filename).suffix.lower()
        filename = f"{user_id[:8]}_{photo_id}{ext}"
        filepath = UPLOAD_DIR / filename

        with open(filepath, "wb") as f:
            shutil.copyfileobj(file.file, f)

        try:
            embedding = get_image_embedding(str(filepath))
            face_encodings = detect_faces(str(filepath))

            photo = {
                "id": photo_id,
                "user_id": user_id,
                "filename": filename,
                "original_name": file.filename,
                "url": f"/uploads/{filename}",
                "favorited": False,
                "trashed": False,
                "created_at": datetime.utcnow().isoformat(),
                "albums": [],
                "has_faces": len(face_encodings) > 0,
                "face_count": len(face_encodings),
            }
            photos_db[photo_id] = photo

            collection.add(
                ids=[photo_id],
                embeddings=[embedding],
                metadatas=[{
                    "user_id": user_id,
                    "filename": filename,
                    "url": f"/uploads/{filename}",
                    "original_name": file.filename,
                    "trashed": "false",
                }]
            )

            if face_encodings:
                assign_face_groups(photo_id, face_encodings, user_id)

            uploaded.append(photo)
        except Exception as e:
            filepath.unlink(missing_ok=True)
            errors.append(f"{file.filename}: {str(e)}")

    return {"uploaded": uploaded, "errors": errors, "total": len(uploaded)}


# ── Photos ──

@app.get("/photos")
def list_photos(user: dict = Depends(get_current_user)):
    user_photos = [
        p for p in photos_db.values()
        if p["user_id"] == user["id"] and not p["trashed"]
    ]
    user_photos.sort(key=lambda x: x["created_at"], reverse=True)
    return {"photos": user_photos, "total": len(user_photos)}


@app.delete("/photos/{photo_id}")
def trash_photo(photo_id: str, user: dict = Depends(get_current_user)):
    photo = photos_db.get(photo_id)
    if not photo or photo["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Photo not found")
    photo["trashed"] = True
    photo["trashed_at"] = datetime.utcnow().isoformat()
    return {"message": "Moved to trash"}


# ── Search ──

@app.post("/search")
def search_photos(req: SearchRequest, user: dict = Depends(get_current_user)):
    user_id = user["id"]
    all_results = collection.get(include=["metadatas"])
    user_ids = [
        all_results["ids"][i]
        for i, m in enumerate(all_results["metadatas"])
        if m.get("user_id") == user_id and m.get("trashed") != "true"
    ]
    if not user_ids:
        return {"results": [], "query": req.query, "total": 0}

    text_emb = get_text_embedding(req.query)
    limit = min(req.limit, len(user_ids))

    results = collection.query(
        query_embeddings=[text_emb],
        n_results=limit,
        where={"user_id": user_id},
        include=["metadatas", "distances"]
    )

    photos = []
    for i, meta in enumerate(results["metadatas"][0]):
        pid = results["ids"][0][i]
        photo = photos_db.get(pid, {})
        if photo.get("trashed"):
            continue
        distance = results["distances"][0][i]
        similarity = round((1 - distance) * 100, 1)
        photos.append({**photo, "similarity": similarity})

    return {"results": photos, "query": req.query, "total": len(photos)}


# ── Favorites ──

@app.post("/photos/{photo_id}/favorite")
def toggle_favorite(photo_id: str, user: dict = Depends(get_current_user)):
    photo = photos_db.get(photo_id)
    if not photo or photo["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    photo["favorited"] = not photo["favorited"]
    return {"favorited": photo["favorited"]}


@app.get("/favorites")
def list_favorites(user: dict = Depends(get_current_user)):
    favs = [
        p for p in photos_db.values()
        if p["user_id"] == user["id"] and p["favorited"] and not p["trashed"]
    ]
    return {"photos": favs, "total": len(favs)}


# ── Trash ──

@app.get("/trash")
def list_trash(user: dict = Depends(get_current_user)):
    trashed = [
        p for p in photos_db.values()
        if p["user_id"] == user["id"] and p["trashed"]
    ]
    return {"photos": trashed, "total": len(trashed)}


@app.post("/photos/{photo_id}/restore")
def restore_photo(photo_id: str, user: dict = Depends(get_current_user)):
    photo = photos_db.get(photo_id)
    if not photo or photo["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    photo["trashed"] = False
    photo.pop("trashed_at", None)
    return {"message": "Restored"}


@app.delete("/photos/{photo_id}/permanent")
def delete_permanently(photo_id: str, user: dict = Depends(get_current_user)):
    photo = photos_db.get(photo_id)
    if not photo or photo["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    filepath = UPLOAD_DIR / photo["filename"]
    filepath.unlink(missing_ok=True)
    try:
        collection.delete(ids=[photo_id])
    except Exception:
        pass
    del photos_db[photo_id]
    return {"message": "Permanently deleted"}


# ── Albums ──

@app.post("/albums")
def create_album(body: AlbumCreate, user: dict = Depends(get_current_user)):
    album_id = str(uuid.uuid4())
    album = {
        "id": album_id,
        "user_id": user["id"],
        "name": body.name,
        "photo_ids": [],
        "created_at": datetime.utcnow().isoformat(),
    }
    albums_db[album_id] = album
    return album


@app.get("/albums")
def list_albums(user: dict = Depends(get_current_user)):
    user_albums = [
        a for a in albums_db.values() if a["user_id"] == user["id"]
    ]
    result = []
    for album in user_albums:
        photos = [photos_db[pid] for pid in album["photo_ids"] if pid in photos_db]
        result.append({**album, "photo_count": len(photos), "cover": photos[0]["url"] if photos else None})
    return {"albums": result}


@app.post("/albums/{album_id}/photos")
def add_to_album(album_id: str, body: AlbumAddPhoto, user: dict = Depends(get_current_user)):
    album = albums_db.get(album_id)
    if not album or album["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Album not found")
    if body.photo_id not in album["photo_ids"]:
        album["photo_ids"].append(body.photo_id)
        if photo := photos_db.get(body.photo_id):
            if album_id not in photo["albums"]:
                photo["albums"].append(album_id)
    return {"message": "Added"}


@app.delete("/albums/{album_id}/photos/{photo_id}")
def remove_from_album(album_id: str, photo_id: str, user: dict = Depends(get_current_user)):
    album = albums_db.get(album_id)
    if not album or album["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Album not found")
    album["photo_ids"] = [p for p in album["photo_ids"] if p != photo_id]
    if photo := photos_db.get(photo_id):
        photo["albums"] = [a for a in photo["albums"] if a != album_id]
    return {"message": "Removed"}


@app.get("/albums/{album_id}")
def get_album(album_id: str, user: dict = Depends(get_current_user)):
    album = albums_db.get(album_id)
    if not album or album["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Album not found")
    photos = [photos_db[pid] for pid in album["photo_ids"] if pid in photos_db]
    return {**album, "photos": photos}


@app.delete("/albums/{album_id}")
def delete_album(album_id: str, user: dict = Depends(get_current_user)):
    album = albums_db.get(album_id)
    if not album or album["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Album not found")
    del albums_db[album_id]
    return {"message": "Album deleted"}


# ── Sharing ──

@app.post("/photos/{photo_id}/share")
def create_share_link(photo_id: str, user: dict = Depends(get_current_user)):
    photo = photos_db.get(photo_id)
    if not photo or photo["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    token = hashlib.sha256(f"{photo_id}{uuid.uuid4()}".encode()).hexdigest()[:24]
    shares_db[token] = photo_id
    return {"token": token, "url": f"/shared/{token}"}


@app.get("/shared/{token}")
def view_shared(token: str):
    photo_id = shares_db.get(token)
    if not photo_id:
        raise HTTPException(status_code=404, detail="Link not found or expired")
    photo = photos_db.get(photo_id)
    if not photo or photo["trashed"]:
        raise HTTPException(status_code=404, detail="Photo not found")
    return {"photo": {k: v for k, v in photo.items() if k != "user_id"}}


# ── Face Groups ──

@app.get("/faces")
def list_face_groups(user: dict = Depends(get_current_user)):
    user_groups = [
        {k: v for k, v in g.items() if k != "encodings"}
        for g in faces_db.values()
        if g["user_id"] == user["id"] and g["photo_ids"]
    ]
    result = []
    for g in user_groups:
        cover = photos_db.get(g["cover_photo_id"])
        result.append({
            **g,
            "cover_url": cover["url"] if cover else None,
            "photo_count": len(g["photo_ids"])
        })
    return {"groups": result}


@app.get("/faces/{group_id}")
def get_face_group(group_id: str, user: dict = Depends(get_current_user)):
    group = faces_db.get(group_id)
    if not group or group["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    photos = [photos_db[pid] for pid in group["photo_ids"] if pid in photos_db]
    return {**{k: v for k, v in group.items() if k != "encodings"}, "photos": photos}


@app.patch("/faces/{group_id}")
def name_face_group(group_id: str, body: FaceGroupName, user: dict = Depends(get_current_user)):
    group = faces_db.get(group_id)
    if not group or group["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Not found")
    group["name"] = body.name
    return {"message": "Named", "name": body.name}
