# AC295 Final Project - Milestone 4 Submission

*Next Top Model*: Michael Lee, Jose Lopez, Micah Nickerson, Victor Sheng

*AC295 | Advanced Practical Data Science | Institute for Applied Computational Science | Harvard University*  

#### Presentation Links
- Presentation Video: [Link](https://drive.google.com/file/d/1H1G7l9GzJv0wj8EKw1QZMpf60dOB_iMP/view?usp=sharing) <br/>
- Presentation Slides: [Link](https://docs.google.com/presentation/d/1eFaaRnLNPVHD59aLsPiCW_Clw-IgCtz4onPosaxBjn8/edit?usp=sharing) <br/>
- Medium Article: [Link](https://medium.com/p/52b13d101385/edit) 

#### Project Deployment
- Website: www.socialdistancingcalculator.xyz

##### Directories inside deployment folder
- **frontend** <br/>
*This directory contains the files required to launch the frontend container and to display the website interface.*

- **maskdetection** <br/>
*This directory contains the files required to launch the mask detection backend container and to perform mask detection video processing.*

- **socialdistancing** <br/>
*This directory contains the files required to launch the social distancing backend container and to perform social distancing video processing.*

##### Files inside deployment folder
- **frontend_deployment_k8s.yaml** <br/>
- **maskdetection_configmap.yaml** <br/>
- **maskdetection_deployment_k8s.yaml** <br/>
- **socialdistancing_configmap.yaml** <br/>
- **socialdistancing_deployment_k8s.yaml** <br/>
*These files are used to set up the deployments and configmaps in the Kubernetes Engine.*
- **ingress_resource.yaml** <br/>
*This file sets up the Ingress controller allowing external traffic to communicate with the website interface.*

#### How to Run Deployment

Download YOLOv4 model weights: <br/>
* Save [Object Detection Weights](https://github.com/AlexeyAB/darknet/releases/download/darknet_yolo_v3_optimal/yolov4.weights) into deployment/socialdistancing/model
* Save [Mask Detection Weights](https://drive.google.com/file/d/1kwA_9aEDCjQQnCEmiHI_b9NsCoO1IbTh/view?usp=sharing) into deployment/maskdetection/yolov4_coco_model

```shell
# Start in deployment directory

# Create environmental variable 
export PROJECT_ID=ac295datascience # update based on your GCP Project ID

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
gcloud container clusters create project-ac295-cluster --num-nodes 2 --machine-type e2-standard-2

# Deploy Kubernetes Configmaps, Deployments, and Services

# IMPORTANT: You must replace our hardcoded Project ID (ac295-data-science-289403) in the image field of all 3 *_deployment_k8s.yaml files with your Project ID!
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
gcloud container clusters delete project-ac295-cluster
```