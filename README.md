# AC295 Final Project - COVID-19 Social Distance Monitoring and Mask Detection Tool

*Team Next Top Model*: Michael Lee, Jose Lopez, Micah Nickerson, Victor Sheng

*AC295 | Advanced Practical Data Science | Institute for Applied Computational Science | Harvard University*  

Please refer to our [Medium article](https://medium.com/p/52b13d101385)  for a description of this project.

##### Directories 
- **frontend** <br/>
*This directory contains the files required to launch the frontend container and to display the website interface.*

- **maskdetection** <br/>
*This directory contains the files required to launch the mask detection backend container and to perform mask detection video processing.*

- **socialdistancing** <br/>
*This directory contains the files required to launch the social distancing backend container and to perform social distancing video processing.*

- **socialdistancing** <br/>
*This directory contains the files used to set up the deployments and configmaps in the Kubernetes Engine and for the Ingress controller.*


#### How to Run Deployment

Download YOLOv4 model weights: <br/>
* Save [Object Detection Weights](https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v3_optimal/yolov4.weights) into deployment/socialdistancing/model
* Save [Mask Detection Weights](https://drive.google.com/file/d/1kwA_9aEDCjQQnCEmiHI_b9NsCoO1IbTh/view?usp=sharing) into deployment/maskdetection/yolov4_coco_model

```shell
# Start in deployment directory

# Create environmental variable 
export PROJECT_ID=_______ # update based on your GCP Project ID

# Build the Docker containers
cd ../frontend
docker build -t gcr.io/${PROJECT_ID}/frontend:webfe -f Docker_frontend .
cd socialdistancing
docker build -t gcr.io/${PROJECT_ID}/socialdistancing_webapp:db -f Docker_socialdistancing .
cd ../maskdetection
docker build -t gcr.io/${PROJECT_ID}/maskdetection_webapp:db -f Docker_maskdetection .
cd ..

# Push Docker containers to Google Container Registry
docker push gcr.io/${PROJECT_ID}/frontend:webfe
docker push gcr.io/${PROJECT_ID}/socialdistancing_webapp:db
docker push gcr.io/${PROJECT_ID}/frontend:webfe

# Create the Kubernetes Cluster 
gcloud container clusters create project-cluster --num-nodes 2 --machine-type e2-standard-2

# Deploy Kubernetes Configmaps, Deployments, and Services

# Note: The Project ID in the image field of all three *_deployment_k8s.yaml files should be updated your GCP Project ID
kubectl create -f frontend_deployment_k8s.yaml
kubectl create -f socialdistancing_configmap.yaml
kubectl create -f socialdistancing_deployment_k8s.yaml
kubectl create -f maskdetection_configmap.yaml
kubectl create -f maskdetection_deployment_k8s.yaml

# Configure Ingress Controller
kubectl apply -f ingress_resource.yaml

# If you have a domain, set the ephermeral IP address to a static IP address here: https://console.cloud.google.com/networking/addresses/
# Go to your domain's DNS settings and set the A record to the specified static IP address.
# If you do not have a domain, use kubectl get all to find the external IP address of the Ingress Controller and access the website through the external IP address.

# Shut down Kubernetes Cluster when finished 
gcloud container clusters delete project-cluster
```