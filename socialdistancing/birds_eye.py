# citing https://www.tutorialspoint.com/find-and-draw-contours-using-opencv-in-python for reference
# https://www.learnopencv.com/find-center-of-blob-centroid-using-opencv-cpp-python/ for reference

import numpy as np
import cv2

def birds_eye(frame, frame_id, person, distance_scale):
    # performs social distancing calculation from a bird's eye perspective
    total_people = len(person.index)
    scale = 1

    scale_x = int(round(frame.shape[0]/scale))
    scale_y = int(round(frame.shape[1]/scale))

    radius = int(round(distance_scale/scale))
    pad_x = 200
    pad_y = 200

    # create a bird's eye image
    bird_image = np.zeros((scale_x+(2*pad_x), scale_y+(2*pad_y), 3), np.uint8)
    bird_image[:] = (200, 200, 200)
    black_color = (0,0,0)
    gray_color = (128, 128, 128)

    # draw circles representing a person
    for p in person["Person"]:
        x_point = int(round(p[0]/scale))
        y_point = int(round(p[1]/scale))
        bird_image = cv2.circle(bird_image, (x_point+pad_x, y_point+pad_y), radius=radius,  color=gray_color, thickness=-1)

    LUV = cv2.cvtColor(bird_image, cv2.COLOR_BGR2LUV)
    # Find edges
    edges = cv2.Canny(LUV, 10, 100)
    # Find contours
    contours = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0]
    # Find Number of contours
    num_contours = len(contours)
    num_single=0
    num_cluster=0
    people_safe = []
    circle_area = np.pi * radius ** 2

    for c in range(num_contours):
        contour_area = cv2.contourArea(contours[c])
        # check if contour is a circle, if so it categorizes it as a safe person
        if (contour_area>0.98*circle_area) and (contour_area<1.02*circle_area): # accounts for rounding variation in circle area calculations
            num_single+=1
            M = cv2.moments(contours[c])
            contour_x = int(round(M["m10"] / M["m00"] * scale) - pad_x)
            contour_y = int(round(M["m01"] / M["m00"] * scale) - pad_y)
            people_safe.append((contour_x, contour_y))
            cv2.drawContours(bird_image, contours, c, (0,255,0),6)
        # if contour is not a circle, then it is a cluster
        else:
            num_cluster+=1
            cv2.drawContours(bird_image, contours, c, (0,0,255), 6)

    return total_people, people_safe, num_single, num_cluster, bird_image









