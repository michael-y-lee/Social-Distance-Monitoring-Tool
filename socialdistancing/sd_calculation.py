# citing https://github.com/deepak112/Social-Distancing-AI for reference
# citing https://docs.opencv.org/3.4/db/d5b/tutorial_py_mouse_handling.html for reference
# citing https://docs.opencv.org/2.4/doc/tutorials/core/basic_geometric_drawing/basic_geometric_drawing.html for reference
# citing https://stackoverflow.com/questions/56472024/how-to-change-the-opacity-of-boxes-cv2-rectangle for reference

# imports
import cv2
import numpy as np
import time
import pandas as pd
import person_detection, birds_eye

input_perspective = []
input_distance = []
average_time = []

# sets the input points based on mouse click events
def set_input_points(event, x, y, f, p):
    global input_perspective
    global input_distance

    if event == cv2.EVENT_LBUTTONDOWN:
        # set the four input points for perspective transformation
        if len(input_perspective) < 4:
            cv2.circle(input_image, (x, y), 5, (0, 0, 255), 10)
            input_perspective.append((x, y))
            if len(input_perspective) == 4: # draw a red bounding box around perspective transformation points
                cv2.polylines(input_image, np.array([[(input_perspective[0][0], input_perspective[0][1]),
                                                                (input_perspective[1][0], input_perspective[1][1]),
                                                                (input_perspective[2][0], input_perspective[2][1]),
                                                                (input_perspective[3][0], input_perspective[3][1])]],
                                                    dtype=np.int32), True,(0, 0, 255), 5)

        # set the two input points for distance
        else:
            cv2.circle(input_image, (x, y), 5, (255, 0, 0), 10)
            input_distance.append((x, y))
            if len(input_distance) == 2:
                cv2.line(input_image, (x, y), (input_distance[0][0], input_distance[0][1]), (255, 0, 0), 2)


def set_perspective(frame, mouse, video_name):
    global input_perspective
    global input_distance
    (H, W) = (300, 300)  # dimensions for perspective transformation XY plane

    # set perspective points by mouse input if mouse flag specified
    if mouse:
        while True:
            cv2.imshow("image", frame)
            cv2.waitKey(1)
            if len(input_distance) == 3:
                cv2.destroyWindow("image")
                break

    # set perspective points if video has already been processed before and perspective points are known
    else:
        print("Selected video:", video_name)
        if video_name == "london_part1":
            input_perspective = [(272, 682), (1005, 607), (551, 446), (158, 485)]
            input_distance = [(298, 638), (489, 619)]
        elif video_name == "london_part2":
            input_perspective = [(162, 663), (816, 700), (1021, 536), (682, 512)]
            input_distance = [(673, 648), (825, 655)]
        elif video_name == "london_part3":
            input_perspective = [(421, 695), (1199, 676), (699, 490), (235, 523)]
            input_distance = [(565, 621), (692, 614)]
        elif video_name == "london_part4":
            input_perspective = [(392, 713), (1022, 512), (464, 414), (67, 470)]
            input_distance = [(356, 638), (522, 601)]
        elif video_name == "london_part5":
            input_perspective = [(164, 649), (1019, 681), (1044, 504), (598, 498)]
            input_distance = [(628, 635), (817, 642)]
        elif video_name == "london_part6":
            input_perspective = [(257, 667), (1093, 580), (519, 418), (119, 456)]
            input_distance = [(392, 614), (567, 598)]
        else:
            raise ValueError("Could not find input points for this video.  Please input points with mouse.")

    input_distance = input_distance[0:2]

    print("input perspective", input_perspective)
    print("input distance", input_distance)

    # perform perspective tranformation
    source = np.float32(np.array(input_perspective))
    destination = np.float32([[0, H], [W, H], [W, 0], [0, 0]])
    transform = cv2.getPerspectiveTransform(source, destination)

    # calculate distance
    input_distance = np.float32(np.array([input_distance]))
    transformed_points = cv2.perspectiveTransform(input_distance, transform)[0]

    # calculate the distance between the two input points in the transformed plane
    distance_scale = np.sqrt((transformed_points[0][0] - transformed_points[1][0]) ** 2 + (transformed_points[0][1] - transformed_points[1][1]) ** 2)

    return transform, distance_scale


def get_transformed_points(boxes, perspective_transform):
    # Transform the bounding boxes based on Perspective Transformation
    person = pd.DataFrame()
    num_person = 1

    for box in boxes:
        point_x = int(box[0]+(box[2]*0.5))
        point_y = int(box[1]+box[3])
        input_point = np.array([[[point_x,point_y]]] , dtype="float32")

        transformed_point = cv2.perspectiveTransform(input_point, perspective_transform)[0][0]
        person_point = (int(transformed_point[0]), int(transformed_point[1]))
        person_df = pd.DataFrame([[box,person_point]],columns=['Box','Person'],index=[num_person])
        person=pd.concat([person, person_df])
        num_person+=1
    return person

def add_bounding_boxes(image, safe, violation):
    # add bounding boxes to frame
    red = (0, 0, 255)
    green = (0, 255, 0)

    # add green bounding boxes to people who are safe
    if len(safe) > 0:
        for s in range(len(safe)):
            x, y, w, h = safe.iloc[s]
            image = cv2.rectangle(image, (x, y), (x + w, y + h), green, 2)

    # add red bounding boxes to people who are violating social distancing
    if len(violation) > 0:
        for v in range(len(violation)):
            x, y, w, h = violation.iloc[v]
            image = cv2.rectangle(image, (x, y), (x + w, y + h), red, 2)
    return image

def social_distancing_calculation(video_name, mouse):
    vid_input = 'input/'
    vid_output = 'output_video/'
    json_output = 'output_json/'

    vid_path = vid_input + video_name +".mp4"
    frame_id = 0
    vs = cv2.VideoCapture(vid_path)    

    height = int(vs.get(cv2.CAP_PROP_FRAME_HEIGHT))
    width = int(vs.get(cv2.CAP_PROP_FRAME_WIDTH))
    fps = int(vs.get(cv2.CAP_PROP_FPS))

    output = pd.DataFrame()

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    output_movie = cv2.VideoWriter(vid_output+video_name+'.mp4', fourcc, fps, (width, height))

    global input_image
    
    while True: # continue loading frames from video
        start_time = time.time()
        (ret, frame) = vs.read()

        # stops processing if there are no more frames to process from video
        if not ret:
            print('complete')
            break

        print("Frame ID:", frame_id)

        # obtain the persepctive transformation and distance measurements
        if frame_id == 0:
            if mouse:
                cv2.namedWindow("image")
                cv2.setMouseCallback("image", set_input_points)
            input_image = frame
            transform, distance_scale = set_perspective(frame, mouse, video_name)

        # perform person_detection
        bounding_boxes = person_detection.detection(frame, height, width)

        # transform people based on perspective transformation
        person = get_transformed_points(bounding_boxes, transform)
        total_people, people_safe, single, cluster, bird_image = birds_eye.birds_eye(frame,frame_id, person, distance_scale)

        people_list = person["Person"]
        set_violation = set(people_list) - set(people_safe)
        people_violation = list(set_violation)
        num_violations = len(people_violation)

        num_unsafe = len(people_list)-len(people_safe)

        # check to make sure that all coordinates of safe people have been removed from the list of violations
        try:
            assert num_violations == num_unsafe
        except Exception:
            print("Frame", frame_id, "Number of violations mismatch:", num_violations, num_unsafe)

        output_df = pd.DataFrame([[people_violation, people_safe, total_people, num_violations, single, cluster]], columns=['people_violation','people_safe', 'total_people','num_violation','num_safe','num_cluster'], index=[frame_id])
        output = pd.concat([output, output_df])

        bounding_boxes_safe = person[person['Person'].isin(people_safe)]["Box"]
        bounding_boxes_violation = person[person['Person'].isin(people_violation)]["Box"]

        output_frame = add_bounding_boxes(frame, bounding_boxes_safe,bounding_boxes_violation)

        # Write video
        if frame_id != 0:
            output_movie.write(output_frame)

        frame_id = frame_id + 1
        total_time = time.time()-start_time
        average_time.append(total_time)
        print("Time:", total_time)

    print("output", output)
    print("average time", np.mean(average_time))
    output.to_json(json_output + video_name+".json")
    vs.release()

