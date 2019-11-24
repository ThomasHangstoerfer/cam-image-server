#!/bin/bash

# qnap: ./watch_for_new_files.sh -w -p 6666 -h pi -d /share/Download/today
# pi  : ./watch_for_new_files.sh -l -p 6666 -m pi


MODE=""
HOST=""
PORT=""
FOLDER=""
MQTT_BROKER=""

if (( "$#" == "0" )); then
	echo "Usage:"
	echo "  Listening: $0 -l -p <port> -m <host"
	echo "    -l          : listens for incomming events"
	echo "    -p <port>   : port number for incomming or sending events"
	echo "    -m <host>   : destination hostname of mqtt-broker"
	echo ""
	echo "  Watching : $0 -w -p <port> -h <host> -d <folder>"
	echo "    -w          : watches a folder for new files and send their names"
	echo "    -p <port>   : port number for incomming or sending events"
	echo "    -h <host>   : destination hostname for sending events"
	echo "    -d <folder> : the folder that is watched for new files"
	exit 1
else

	while (( "$#" )); do
		if [[ "$1" == "-l" ]]; then 
			MODE=L
		elif [[ "$1" == "-w" ]]; then 
			MODE=W
		elif [[ "$1" == "-p" ]]; then
			PORT=$2
			shift
		elif [[ "$1" == "-h" ]]; then
			HOST=$2
			shift
		elif [[ "$1" == "-d" ]]; then
			FOLDER=$2
			shift
		elif [[ "$1" == "-m" ]]; then
			MQTT_BROKER=$2
			shift
		fi
		shift
	done
fi

if [[ "$MODE" == "W" ]]; then
	echo "Watching for new files in $FOLDER and sending their filenames to ${HOST}:${PORT}"
	while true ; do
		FILE=`inotifywait -e create /share/HDA_DATA/Download/today --format "%f"`
		echo "new file detected: $FILE"
		echo $FILE | nc -q 0 $HOST $PORT
	done
elif [[ "$MODE" == "L" ]]; then
	echo "Listening for incomming filenames on port $PORT and forwarding them to mqtt-broker ${MQTT_BROKER}"
	while true ; do 
		FILE=`netcat -p $PORT -l`
		echo "Received new filename: $FILE"
		echo "Publish to cam/newImage"
		mosquitto_pub -h ${MQTT_BROKER} -t "cam/newImage" -m "$FILE" -r
	done
else
	echo "$0: Error invalid mode '$MODE'"
fi
