# citing https://googleapis.dev/python/storage/latest/index.html for reference
# citing https://cloud.google.com/storage/docs/uploading-objects#storage-upload-object-code-sample for reference

from flask import Flask, request
import sd_calculation
from google.cloud import storage


app = Flask(__name__)

def find_video(video_name):
    # finds if social distancing video output is already available. If not, it downloads the source video to perform social distancing processing.
    input_video = "input/" + video_name + ".mp4"
    sd_output_video = "social_distancing/output_video/"+video_name+".mp4"
    sd_output_json = "social_distancing/output_json/"+video_name+".json"

    storage_client = storage.Client.from_service_account_json('keyfile.json')
    bucket_name = 'project_ac295'
    bucket = storage_client.bucket(bucket_name)
    print("GCP bucket", bucket)

    video_exists = storage.Blob(bucket=bucket, name=sd_output_video).exists(storage_client)
    json_exists = storage.Blob(bucket=bucket, name=sd_output_json).exists(storage_client)

    input_video_exists = storage.Blob(bucket=bucket, name=input_video).exists(storage_client)

    try:
        assert input_video_exists
    except Exception:
        raise FileNotFoundError("Input video cannot be found.")

    print("GCP video", video_exists)
    print("GCP json", json_exists)
    if video_exists and json_exists:
        sd_output = True
    else:
        sd_output = False
        # download input video to local machine
        blob = bucket.blob(input_video)
        blob.download_to_filename(input_video)
    print("sd_output", sd_output)
    return sd_output

def upload_file(video_name):
    # Uploads video and json files to GCP bucket
    bucket_name = 'project_ac295'
    sd_local_video = "output_video/" + video_name+".mp4"
    sd_bucket_video = "social_distancing/output_video/"+video_name+".mp4"
    sd_local_json = "output_json/" + video_name + ".json"
    sd_bucket_json = "social_distancing/output_json/" + video_name + ".json"

    storage_client = storage.Client.from_service_account_json('keyfile.json')
    bucket = storage_client.bucket(bucket_name)

    video_blob = bucket.blob(sd_bucket_video)
    video_blob.upload_from_filename(sd_local_video)
    json_blob = bucket.blob(sd_bucket_json)
    json_blob.upload_from_filename(sd_local_json)

    print("{} uploaded to GCP bucket: {}.".format(sd_local_video, sd_bucket_video))
    print("{} uploaded to GCP bucket: {}.".format(sd_local_json, sd_bucket_json))


@app.route("/",methods=['POST','GET'])
def mainm():
    if request.method=='POST':
        #Retrieve the data_id submitted by the user. Get the data corresponding
        # to this id and return it back to the user.

        record = request.get_json()['camera_file_name']

        video_name = record

        find_video_output = find_video(video_name)

        if find_video_output:
            return "In Social Distancing module, File has been found: " + str(record)

        else:

            sd_calculation.social_distancing_calculation(video_name=video_name, mouse=False)
            upload_file(video_name)
            return "In Social Distancing module, File has NOT been found so video was processed: " + str(record)


    else: #wrong port traffic!!
        return "Method Forbidden: Social Distancing does not accept GET requests - try using post!"

if __name__=="__main__":
    app.run(host='0.0.0.0', port=8082, debug=True)

