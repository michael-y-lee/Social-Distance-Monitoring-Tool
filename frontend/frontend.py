from flask import Flask, render_template, request
import sys
import requests
import random
import json
import os

###############################
### Flask Dev Server
###############################

app = Flask(__name__)

app.static_folder = 'templates'

###############################
### REST CRUD
###############################

@app.route("/", methods=['POST', 'GET'])
def mainm():
    if request.method == 'POST':  # User clicked a video icon to button
        try:
            cam_file_name = request.form['camera_file_name']  # send this data_id to backend containers
            resp = requests.post(camclip=cam_file_name)
            clipProcessStatusFlag = json.loads(resp.content)
            return render_template('index.html', processingStatus=clipProcessStatusFlag)
        except:
            return render_template('index.html') #just reload the webpage if no response
    else: #fresh webpage load
        return render_template('index.html') #load the webpage for first time


###############################
### SERVER INITIALIZATION
###############################

if __name__ == "__main__":
    if (len(sys.argv) == 3):
        metadatadb_url = 'http://' + sys.argv[1] + ':8082'
        similaritydb_url = 'http://' + sys.argv[2] + ':8083'
    else:
        metadatadb_url = "http://localhost:8082/"
        similaritydb_url = "http://localhost:8083/"

    app.run(host='0.0.0.0', port=8081, debug=True)