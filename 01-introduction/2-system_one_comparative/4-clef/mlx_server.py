# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "clef-mlx @ git+https://github.com/daoa0601/clef-mlx@40c9ee6ddce1864060f187fe4cc34bee3d642ab9",
#   "fastapi",
#   "uvicorn",
# ]
# ///
import os

import uvicorn
from clef_mlx import load
from fastapi import FastAPI, HTTPException

clef = load(os.environ["CLEF_MODEL"], vision=False)
app = FastAPI()


@app.post("/v1/systemone")
async def systemone(request: dict):
    request.setdefault("model", "clef-flash")
    try:
        return clef.systemone(request)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8787)
