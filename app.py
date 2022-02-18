import pathlib
import sys
import logging

from flask import Flask, render_template, request

from utils import compute_matrix, parse_form_data

app = Flask(__name__)

logger = logging.getLogger("__howfarfrom_app_main__")
logger.setLevel(logging.DEBUG)
formatter = logging.Formatter("%(asctime)s - %(name)s:%(levelname)s - %(message)s")

file_handler = logging.FileHandler(filename="howfarfrom_app_main.log")
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)

logger.addHandler(file_handler)

if sys.platform == "win32":
    temp = pathlib.PosixPath
    pathlib.PosixPath = pathlib.WindowsPath

@app.route('/', methods=["GET", "POST"])
def home():
    if request.method =="POST":
        form_data = request.form.to_dict()
        logger.debug(form_data)

        parsed_form_data = parse_form_data(form_data)
        matrix = compute_matrix(parsed_form_data)

        return render_template("home.html", matrix=matrix)
        
    return render_template("home.html")

@app.route('/contact', methods=["GET"])
def contact():
    return render_template("contact.html")

@app.route('/about', methods=["GET"])
def about():
    return render_template("about.html")

if __name__ == '__main__':
    app.run()