// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose
// the link to your model provided by Teachable Machine export panel 경로 모델 폴더
// 설정, 새로운 모델 추가 시 새로운 폴더를 생성하여 URL 바꿔주어야함

'use strict';

let URL = "./my_model/prone/";
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
    pose0 = "prone",
    pose1 = "narrow",
    pose2 = "right",
    pose3 = "bend",
    pose0p = "정자세",
    pose1p = "다리 좁음",
    pose2p = "오른다리 벌어짐",
    pose3p = "다리 구부러짐";

function poseSelect() {
    $(document).ready(function () {
        selectPose = $("#inputGroupSelect01 option:selected").val();
        URL = "./my_model/" + selectPose + "/";
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
                $("#btn-box").html(item[selectPose].name + " 요령");
            });
        });
    });
};

const flip = true; // whether to flip the webcam
webcam = new tmPose.Webcam(400, 400, flip); // width, height, flip
await webcam.setup(); // request access to the webcam
webcam.setup({ facingMode: "environment" })

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

    webcam.play();
    // 루프구문
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById('canvas');
    canvas.width = 400;
    canvas.height = 400;
    ctx = canvas.getContext('2d');
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
    webcam.update(); // update the webcam frame
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

function drawPose(pose) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
        const minPartConfidence = 0.5;
        tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
        tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
}