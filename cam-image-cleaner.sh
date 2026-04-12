#!/bin/sh

# Beim Systemstart wird 
# /share/HDA_DATA/.qpkg/autorun/install_cam-image-cleaner_in_crontab.sh
# gestartet


#59 23 * * * /share/CACHEDEV1_DATA//Download/cam-image-cleaner.sh >> /share/CACHEDEV1_DATA//Download/cam-image-cleaner.log 2>&1
#* * * * * /tmp/cam-image-cleaner.sh >> /tmp/cam-image-cleaner.log 2>&1
# führe script einmal pro Tag um 23:59h aus

echo "++++++++++++++++++++++++++++"
echo "Running cam-image-cleaner.sh"
echo `date`
echo "++++++++++++++++++++++++++++"

#BASEDIR=/share/CACHEDEV1_DATA//Download
BASEDIR=/share/Download

cd $BASEDIR
echo "BASEDIR = ${BASEDIR}"

#CUR_DATE=`date +%Y-%m-%d`
#echo "CUR_DATE = ${CUR_DATE}"
#TARGETDIR=${BASEDIR}/${CUR_DATE}
#echo "TARGETDIR = ${TARGETDIR}"

#mkdir -p ${TARGETDIR}

#mv ${BASEDIR}/today/*.jpg ${TARGETDIR}

for FILE in ${BASEDIR}/today/*.jpg ; do
	FILETS=`stat  $FILE -c "%y" |cut  -c1-19| sed -e "s/ /_/" -e "s/-//g" -e "s/://g"`
	NEWNAME=cam-${FILETS}.jpg

	YEAR=`echo $FILETS | cut -c1-4`
	MONTH=`echo $FILETS | cut -c5-6`
	DAY=`echo $FILETS | cut -c7-8`
	HOUR=`echo $FILETS | cut -c10-11`
	MINUTE=`echo $FILETS | cut -c12-13`
	SECOND=`echo $FILETS | cut -c14-15`
	TARGETDIR=${BASEDIR}/${YEAR}-${MONTH}-${DAY}
	echo TARGETDIR ${TARGETDIR}

	mkdir -p ${TARGETDIR}
	mv $FILE ${TARGETDIR}/$NEWNAME

done

chown -R thomas:everyone ${BASEDIR}*
echo ""


