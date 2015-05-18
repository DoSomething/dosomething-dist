#!/bin/bash

TEMP_FILE_1=tmp1.png
TEMP_FILE_2=tmp2.png
BOLD_FONT_PATH=`/usr/bin/find /var/www -name "ProximaNova-Bold.otf"`
REG_FONT_PATH=`/usr/bin/find /var/www -name "ProximaNova-Reg.otf"`
FINAL_FILE=`/usr/bin/find /var/www -type d -name "dosomething_campaign_problem_shares"`/images/$1.jpg

convert \
  -size 471x248 \
  canvas:#23B7FB \
  -fill "#337D9F" \
  -pointsize 16 \
  -font $BOLD_FONT_PATH \
  -annotate +20+40 'Make a Difference' \
  $TEMP_FILE_1

convert \
  -background transparent \
  -size 431x228 \
  -fill white \
  -font $REG_FONT_PATH \
  -pointsize 24 \
  caption:"$2" \
  $TEMP_FILE_2 \

composite \
  $TEMP_FILE_2 \
  -gravity northwest \
  -geometry +20+50 \
  $TEMP_FILE_1 \
  $FINAL_FILE

rm $TEMP_FILE_1
rm $TEMP_FILE_2
