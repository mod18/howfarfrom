import json
import logging
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import Json
from typing import Any
from .cloud_api_connector import CloudApiConnector
from .utils import compute_matrix

logger = logging.getLogger("__main_api__")
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter("%(asctime)s - %(name)s:%(levelname)s - %(message)s")

stream_handler = logging.StreamHandler(stream=sys.stdout)
stream_handler.setLevel(logging.INFO)
stream_handler.setFormatter(formatter)

file_handler = logging.FileHandler(filename="main_api.log")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)

logger.addHandler(stream_handler)
logger.addHandler(file_handler)

app = FastAPI()

origins = [
    "http://localhost:3000",
    "localhost:3000",
    "http://localhost:5173",
    "localhost:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/", tags=["root"])
async def root() -> dict:
    return {"message": "Hello World!"}

@app.get("/cloud_api/get_place/{query}")
async def get_place(query: str) -> Json:
    q = CloudApiConnector()
    place = q.get_place(query)
    return place.model_dump(include={'id', 'name', 'lat', 'lng'})

@app.get("/cloud_api/get_distances/{query}")
async def get_distances(query: str) -> Any:
    matrix = compute_matrix(json.loads(query))
    return matrix.model_dump(include={'formatted_matrix'})