#!/bin/bash

# qnap    : ./watch_for_new_files.sh -w -p 6666 -h apollo -d /share/Download/today
# apollo  : ./watch_for_new_files.sh -l -p 6666 -m apollo


MODE=""
HOST=""
PORT=""
FOLDER=""
MQTT_BROKER="192.168.1.65" # apollo.fritz.box

if (( "$#" == "0" )); then
	echo "Usage:"
	echo "  Watching : $0 -m <mqtt-broker> -d <folder>"
	echo "    -m <mqtt-broker> : hostname of mqtt-broker"
	echo "    -d <folder>      : the folder that is watched for new files"
	exit 1
else

	while (( "$#" )); do
		if [[ "$1" == "-d" ]]; then
			FOLDER=$2
			shift
		elif [[ "$1" == "-m" ]]; then
			MQTT_BROKER=$2
			shift
		fi
		shift
	done
fi


if [[ "$FOLDER" == "" ]]; then
	echo "Folder ('-d <folder>') is missing!"
	echo ""
	exit 1
fi

echo "Watching for new files in $FOLDER"
while true ; do
#	FILE=`inotifywait -e create /share/HDA_DATA/Download/today --format "%f"`
#	echo "new file detected: $FILE"
#	echo $FILE | nc -q 0 $HOST $PORT
	FILE=`inotifywait -e create ${FOLDER} --format "%f" `
	echo $FILE  > /tmp/image_watcher
	echo "new file detected: ${FILE}"
	# wait 1 sec until the camera has written the file
	#sleep 1
	echo "Publish to cam/newImage"
	mosquitto_pub -h ${MQTT_BROKER} -t "cam/newImage" -m "$FILE" -r
done
