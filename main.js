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

// 비디오 셀렉터와 비디오 속성 추출
var videoElement = document.querySelector('video');
var videoSelect = document.querySelector('select#videoSource');

// 비디오 셀렉터가 바뀔 때 getStream 실행
videoSelect.onchange = getStream;

// getDevices와 gotDevices 실행
getStream()
    .then(getDevices)
    .then(gotDevices);

// getStream에 의해 실행, enumerateDevices함수 실행 getStream에서 얻은 디바이스를 안내해주어
// gotDevices로 보내주는 역할
function getDevices() {
    // AFAICT in Safari this only gets default devices until gUM is called :/
    return navigator
        .mediaDevices
        .enumerateDevices();
}

// getStream에 의해 실행하며 getDevices에서 얻어진 디바이스를 받아 출력함
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

// 디바이스에 대한 속성을 추출해냄
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
// the link to your model provided by Teachable Machine export panel 경로 모델 폴더
// 설정, 새로운 모델 추가 시 새로운 폴더를 생성하여 URL 바꿔주어야함
let URL = "./my_model/prone";
// 초기 값 설정
let model,
    labelContainer,
    maxPredictions,
    status,
    prestatus,
    count = 6,
    pre0 = 0.25,
    pre1 = 0.25,
    pre2 = 0.25,
    pre3 = 0.25,
    selectPose = "prone",
    pose0,
    pose1,
    pose2,
    pose3,
    pose0p,
    pose1p,
    pose2p,
    pose3p;

function poseSelect() {
    $(document).ready(function () {
        selectPose = $("#inputGroupSelect01 option:selected").val();
        URL = "./my_model/" + selectPose;
        $.getJSON('pose.json', function (data) {
            $.each(data, function (i, item) {
                pose0 = item[selectPose].pose0;
                pose1 = item[selectPose].pose1;
                pose2 = item[selectPose].pose2;
                pose3 = item[selectPose].pose3;
                pose0p = item[selectPose].pose0p;
                pose1p = item[selectPose].pose1p;
                pose2p = item[selectPose].pose2p;
                pose3p = item[selectPose].pose3p;
                $(".card-body").html(item[selectPose].description);
            });
        });
    });
};

// 클릭버튼 연결된 함수
async function init() {
    $(document).ready(function () {
        $(".first").empty();
        $(".starting").html(
            '<div class="spinner-border" role="status"><span class="sr-only">Loading...</sp' +
            'an></div>'
        );
    });
    // 모델 파일 연결
    var modelURL = URL + "model.json";
    var metadataURL = URL + "metadata.json";
    // 모델 파일에서 모델 함수를 추출해냄
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // 루프구문
    window.requestAnimationFrame(loop);
}
// statusVoice 실행을 위한 초기 구문
document.addEventListener("DOMContentLoaded", function () {

    // 이후 2초에 한번씩 시간을 갱신한다.
    setInterval(statusVoice, 2000);
});

// 음성으로 행동 말해주는 함수
function statusVoice() {
    if (status == pose0 && count == 6) {
        var audio = new Audio(status + '.mp3');
        audio.play();
        count = 5;
        status = "";
    } else if (status == pose0 && count > 0) {
        var audio = new Audio(count + '.mp3');
        audio.play();
        count--;
        status = "";
    } else if (count == 0) {
        var audio = new Audio(count + '.mp3');
        audio.play();
        count = 6;
        status = "";
    } else if (status == pose1 && prestatus != status) {
        var audio = new Audio(status + '.mp3');
        audio.play();
        count = 6;
        prestatus = status;
    } else if (status == pose2 && prestatus != status) {
        var audio = new Audio(status + '.mp3');
        audio.play();
        count = 6;
        prestatus = status;
    } else if (status == pose3 && prestatus != status) {
        var audio = new Audio(status + '.mp3');
        audio.play();
        count = 6;
        prestatus = status;
    };
    if (status) {
        $(document).ready(function () {
            $(".starting").empty()
        })
    }
}

// 실시간으로 예측해줄수 있도록 예측 함수와 루프문으로 이루어짐
async function loop(timestamp) {
    await predict();
    window.requestAnimationFrame(loop);
}

// 예측 함수
async function predict() {
    // Prediction #1: run input through posenet estimatePose can take in an image,
    // video or canvas html element
    const {pose, posenetOutput} = await model.estimatePose(videoElement, false);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    // 확률 안정화
    pre0 += (prediction[0].probability.toFixed(2) - pre0) * 0.2
    pre1 += (prediction[1].probability.toFixed(2) - pre1) * 0.2
    pre2 += (prediction[2].probability.toFixed(2) - pre2) * 0.2
    pre3 += (prediction[3].probability.toFixed(2) - pre3) * 0.2

    // 확률 바 설정 $ 이용
    $(document).ready(function () {
        // $("#status").html(status + count);
        $(".container0").css("width", parseInt(pre0 * 100) + "%");
        $(".container1").css("width", parseInt(pre1 * 100) + "%");
        $(".container2").css("width", parseInt(pre2 * 100) + "%");
        $(".container3").css("width", parseInt(pre3 * 100) + "%");
        $(".container0").html(pose0p + " : " + parseInt(pre0 * 100) + "%");
        $(".container1").html(pose1p + " : " + parseInt(pre1 * 100) + "%");
        $(".container2").html(pose2p + " : " + parseInt(pre2 * 100) + "%");
        $(".container3").html(pose3p + " : " + parseInt(pre3 * 100) + "%");
    });

    // status 업데이트
    if (pre0 >= 0.80) {
        status = pose0;
    } else if (pre1 >= 0.80) {
        status = pose1;
    } else if (pre2 >= 0.80) {
        status = pose2;
    } else if (pre3 >= 0.80) {
        status = pose3;
    }

    drawPose(pose);
}

var canvas1 = document.getElementById('canvas');
var ctx = canvas1.getContext('2d');
videoElement.addEventListener('play', function () {
    var $this = this;
    (function loop() {
        if (!$this.paused && !$this.ended) {
            ctx.drawImage($this, 0, 0, 400, 400);
            setTimeout(loop, 1000 / 30);
        }
    })();
}, 0);

function drawPose(pose) {
    if (videoElement) {
        ctx.drawImage(videoElement, 0, 0, 400, 400);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}