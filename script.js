/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

var videoElement = document.querySelector('video');
var videoSelect = document.querySelector('select#videoSource');

videoSelect.onchange = getStream;

getStream()
    .then(getDevices)
    .then(gotDevices);

function getDevices() {
    // AFAICT in Safari this only gets default devices until gUM is called :/
    return navigator
        .mediaDevices
        .enumerateDevices();
}

function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos; // make available to console
    console.log('Available input and output devices:', deviceInfos);
    for (const deviceInfo of deviceInfos) {
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        }
    }
}

function getStream() {
    if (window.stream) {
        window
            .stream
            .getTracks()
            .forEach(track => {
                track.stop();
            });
    }
    const videoSource = videoSelect.value;
    const constraints = {
        video: {
            deviceId: videoSource
                ? {
                    exact: videoSource
                }
                : undefined
        }
    };
    return navigator
        .mediaDevices
        .getUserMedia(constraints)
        .then(gotStream)
        .catch(handleError);
}

function gotStream(stream) {
    window.stream = stream; // make stream available to console
    videoSelect.selectedIndex = [...videoSelect.options].findIndex(
        option => option.text === stream.getVideoTracks()[0].label
    );
    videoElement.srcObject = stream;
}

function handleError(error) {
    console.error('Error: ', error);
}

// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose
// the link to your model provided by Teachable Machine export panel 경로

const URL = "./my_model/";
// 초기 값 설정
let model,
    labelContainer,
    maxPredictions,
    status;

let count = 5

// 클릭버튼 연결된 함수
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    window.requestAnimationFrame(loop);
}

document.addEventListener("DOMContentLoaded", function () {
    // 시간을 딜레이 없이 나타내기위한 선 실행
    statusVoice();
    // 이후 2초에 한번씩 시간을 갱신한다.
    setInterval(statusVoice, 1000);
});

function statusVoice() {
    // 음성으로 행동 말해주기
    if (prediction[0].probability.toFixed(2) >= 0.90) {
        if (status != "prone") {
            status = "prone";
            var audio = new Audio(status + '.mp3');
            audio.play();
        } else if (status == "prone" && count >= 0) {
            var audio = new Audio(count + '.mp3');
            audio.play();
            count -= 1;
        } else {
            count = 5;
            status = "";
        }
    } else if (prediction[1].probability.toFixed(2) >= 0.90) {
        if (status != "bend") {
            status = "bend";
            var audio = new Audio(status + '.mp3');
            audio.play();
            count = 5;
        }
    } else if (prediction[2].probability.toFixed(2) >= 0.90) {
        if (status != "right") {
            status = "right";
            var audio = new Audio(status + '.mp3');
            audio.play();
            count = 5;
        }
    } else if (prediction[3].probability.toFixed(2) >= 0.90) {
        if (status != "narrow") {
            status = "narrow";
            var audio = new Audio(status + '.mp3');
            audio.play();
            count = 5;
        }
    }

}
// 1자리수의 숫자인 경우 앞에 0을 붙여준다.

async function loop(timestamp) {
    var videoElement = document.querySelector('video');
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet estimatePose can take in an image,
    // video or canvas html element
    const {pose, posenetOutput} = await model.estimatePose(videoElement, false);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    $(document).ready(function () {
        $(".container0").css(
            "width",
            parseInt(prediction[0].probability.toFixed(2) * 100) + "%"
        );
        $(".container0").html(
            "정자세: " + parseInt(prediction[0].probability.toFixed(2) * 100) + "%"
        );
        $(".container1").css(
            "width",
            parseInt(prediction[1].probability.toFixed(2) * 100) + "%"
        );
        $(".container1").html(
            "다리 구부러짐: " + parseInt(prediction[1].probability.toFixed(2) * 100) + "%"
        );
        $(".container2").css(
            "width",
            parseInt(prediction[2].probability.toFixed(2) * 100) + "%"
        );
        $(".container2").html(
            "오른다리 일직선: " + parseInt(prediction[2].probability.toFixed(2) * 100) + "%"
        );
        $(".container3").css(
            "width",
            parseInt(prediction[3].probability.toFixed(2) * 100) + "%"
        );
        $(".container3").html(
            "다리 좁음: " + parseInt(prediction[3].probability.toFixed(2) * 100) + "%"
        );
    });

    drawPose(pose);
}

var canvas1 = document.getElementById('canvas');
var context = canvas1.getContext('2d');
videoElement.addEventListener('play', function () {
    var $this = this;
    (function loop() {
        if (!$this.paused && !$this.ended) {
            context.drawImage($this, 0, 0, 400, 400);
            setTimeout(loop, 1000 / 30);
        }
    })();
}, 0);

function drawPose(pose) {
    if (videoElement) {
        context.drawImage(videoElement, 0, 0, 400, 400);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, context);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, context);
        }
    }
}