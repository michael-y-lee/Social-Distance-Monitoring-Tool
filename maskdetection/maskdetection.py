from flask import Flask, request
import os
import numpy as np
import time
import pickle
import yolov4maskvideo
from google.cloud import storage

app = Flask(__name__)

def find_video(video_name):
    # finds if mask detection video output is already available. If not, it downloads the source video to perform mask detection processing.
    input_video = "input/" + video_name + ".mp4"
    md_output_video = "mask_detection/output_video/"+video_name+".mp4"
    md_output_json = "mask_detection/output_json/"+video_name+".json"

    storage_client = storage.Client.from_service_account_json('keyfile.json')
    bucket_name = 'project_ac295'
    bucket = storage_client.bucket(bucket_name)
    print("GCP bucket", bucket)

    video_exists = storage.Blob(bucket=bucket, name=md_output_video).exists(storage_client)
    json_exists = storage.Blob(bucket=bucket, name=md_output_json).exists(storage_client)

    input_video_exists = storage.Blob(bucket=bucket, name=input_video).exists(storage_client)

    try:
        assert input_video_exists
    except Exception:
        raise FileNotFoundError("Input video cannot be found.")

    print("GCP video", video_exists)
    print("GCP json", json_exists)
    if video_exists and json_exists:
        md_output = True
    else:
        md_output = False
        # download input video to local machine
        blob = bucket.blob(input_video)
        blob.download_to_filename(input_video)
    print("md_output", md_output)
    return md_output

def upload_file(video_name):
    # Uploads video and json files to GCP bucket
    bucket_name = 'project_ac295'
    md_local_video = "output_video/" + video_name+".mp4"
    md_bucket_video = "mask_detection/output_video/"+video_name+".mp4"
    md_local_json = "output_json/" + video_name + ".json"
    md_bucket_json = "mask_detection/output_json/" + video_name + ".json"

    storage_client = storage.Client.from_service_account_json('keyfile.json')
    bucket = storage_client.bucket(bucket_name)

    video_blob = bucket.blob(md_bucket_video)
    video_blob.upload_from_filename(md_local_video)
    json_blob = bucket.blob(md_bucket_json)
    json_blob.upload_from_filename(md_local_json)

    print("{} uploaded to GCP bucket: {}.".format(md_local_video, md_bucket_video))
    print("{} uploaded to GCP bucket: {}.".format(md_local_json, md_bucket_json))

@app.route("/",methods=['POST','GET'])
def mainm():
    if request.method=='POST':
        #Retrieve the data_id submitted by the user. Get the data corresponding
        # to this id and return it back to the user.
        # record = request.get_json()['user_image']
        #################################################
        record = request.get_json()['camera_file_name']

        video_name = record
        # check if video and json already exists

        find_video_output = find_video(video_name)

        if find_video_output:
            return "In Mask Detection module, File has been found: " + str(video_name )

        else:

            yolov4maskvideo.mask_detection(video_name)
            upload_file(video_name)

            return "In Mask Detection module, File has NOT been found so video was processed: " + str(video_name )

    else:
        return "Method Forbidden: Mask Detection module does not accept GET requests - try using post!"

if __name__=="__main__":
    app.run(host='0.0.0.0', port=8083, debug=True)