# Based on yolov4-mask-video.py in maskdetection module
import numpy as np
import cv2

def detection(frame, height, width):
    with open('model/coco.names') as f:
        labels = [line.strip() for line in f]

    # Load trained YOLO v4 Objects Detector model with dnn library from OpenCV.
    network = cv2.dnn.readNetFromDarknet('model/yolov4.cfg',
                                         'model/yolov4.weights')

    layers_names_all = network.getLayerNames()     # list with names of all layers from YOLO v3 network
    layers_names_output = network.getUnconnectedOutLayersNames()     # Output layers' names that we need in forward pass
    probability_minimum = 0.50 # Set minimum probability to filter out weak predictions
    threshold = 0.4

    # Generating colors for representing every detected object
    colors = np.random.randint(0, 255, size=(len(labels), 3), dtype='uint8')

    blob = cv2.dnn.blobFromImage(frame, 1 / 255.0, (416, 416), swapRB=True, crop=False)


    # Forward pass with our blob and only through output layers
    network.setInput(blob)  # set blob as input to the network
    output_from_network = network.forward(layers_names_output)

    # Lists for detected bounding box, confidence, and class number
    bounding_boxes = []
    confidences = []
    class_numbers = []
    processed_bounding_boxes = []

    # Going through all output layers after feed forward pass
    for result in output_from_network:
        # Going through all detections from current output layer
        for detected_objects in result:
            scores = detected_objects[5:] # Getting 80 class probabilities for current detected object
            class_current = np.argmax(scores) # Getting index of the class with the maximum value of probability


            if class_current == 0: # selecting humans only
                confidence_current = scores[class_current] # Getting value of probability for defined class

                # Eliminating weak predictions with minimum probability
                if confidence_current > probability_minimum:
                    box_current = detected_objects[0:4] * np.array([width, height, width, height]) # Scaling bounding box coordinates to the initial frame size

                    x_center, y_center, box_width, box_height = box_current # Get top left corner coordinates: x_min and y_min
                    x_min = int(x_center - (box_width / 2))
                    y_min = int(y_center - (box_height / 2))

                    # Add results into prepared lists
                    bounding_boxes.append([x_min, y_min, int(box_width), int(box_height)])
                    confidences.append(float(confidence_current))
                    class_numbers.append(class_current)

    "Non-maximum suppression"
    results = cv2.dnn.NMSBoxes(bounding_boxes, confidences,
                               probability_minimum, threshold)

    # Check if there is at least one detected object after non-maximum suppression
    if len(results) > 0:
        # Going through indexes of results
        for i in results.flatten():
            processed_bounding_boxes.append([bounding_boxes[i][0], bounding_boxes[i][1], bounding_boxes[i][2], bounding_boxes[i][3]])

    return processed_bounding_boxes