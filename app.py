import pathlib
import sys
import logging

from flask import Flask, render_template, request
from cloud_api_connector import CloudApiConnector

app = Flask(__name__)

logger = logging.getLogger("__howfarfrom_app_main__")
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter("%(asctime)s - %(name)s:%(levelname)s - %(message)s")

stream_handler = logging.StreamHandler(stream=sys.stdout)
stream_handler.setLevel(logging.INFO)
stream_handler.setFormatter(formatter)

file_handler = logging.FileHandler(filename="howfarfrom_app_main.log")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)

logger.addHandler(stream_handler)
logger.addHandler(file_handler)

if sys.platform == "win32":
    temp = pathlib.PosixPath
    pathlib.PosixPath = pathlib.WindowsPath

@app.route('/', methods=["GET", "POST"])
def home():
    if request.method =="POST":
        form_data = request.form
        logger.debug(form_data)
        
    return render_template("home.html", num_origins=1, num_destinations=5)

if __name__ == '__main__':
    app.run()