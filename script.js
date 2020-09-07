// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose
// the link to your model provided by Teachable Machine export panel 경로

(function () {

    var canvas = document.getElementById('canvas'),
        context = canvas.getContext('2d'),
        video = document.getElementById('video')

    navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetuserMedia || navigator.msGetUserMedia;

    navigator.getMedia({
        video: true,
        audio: false
    }, function (stream) {
        video.src = URL.createObjectURL(stream);
        video.play();
    }, function (error) {
        // an error occurred
    });

    video.addEventListener('play', function () {
        draw(this, context, 1024, 768);
    }, false);

    function draw(video, context, width, height) {
        var image,
            data,
            i,
            r,
            g,
            b,
            brightness;

        context.drawImage(video, 0, 0, width, height);

        image = context.getImageData(0, 0, width, height);
        data = image.data;

        for (i = 0; i < data.length; i += 4) {
            r = data[i];
            g = data[i + 1];
            b = data[i + 2];
            brightness = (r + g + b) / 3;

            data[i] = data[i + 1] = data[i + 2] = brightness;
        }

        image.data = data;

        context.putImageData(image, 0, 0);

        setTimeout(draw, 10, video, context, width, height);
    }

})();

const URL = "./my_model/";
// 초기 값 설정
let model,
    webcam,
    ctx,
    labelContainer,
    maxPredictions,
    status;

// 클릭버튼 연결된 함수
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // load the model and metadata Refer to tmImage.loadFromFiles() in the API to
    // support files from a file picker
    // Note: the pose library adds a tmPose object to your window (window.tmPose)
    model = await tmPose.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const size = 400;
    const flip = true; // whether to flip the webcam
    webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append/get elements to the DOM
    const canvas = document.getElementById("canvas");
    canvas.width = size;
    canvas.height = size;
    ctx = canvas.getContext("2d");
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

async function loop(timestamp) {
    webcam.update(); // update the webcam frame
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    // Prediction #1: run input through posenet estimatePose can take in an image,
    // video or canvas html element
    const {pose, posenetOutput} = await model.estimatePose(webcam.canvas);
    // Prediction 2: run input through teachable machine classification model
    const prediction = await model.predict(posenetOutput);

    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction = prediction[i].className + ": " + prediction[i]
            .probability
            .toFixed(2);
        labelContainer
            .childNodes[i]
            .innerHTML = classPrediction;
    }
    // finally draw the poses
    drawPose(pose);

    // 음성으로 행동 말해주기
    if (prediction[0].probability.toFixed(2) >= 0.99) {
        if (status == "bend" || status == "right" || status == "narrow") {
            status = "prone";
            var audio = new Audio(status + '.mp3');
            audio.play();
        }
        status = "prone";
    } else if (prediction[1].probability.toFixed(2) >= 0.99) {
        if (status == "prone" || status == "right" || status == "narrow") {
            status = "bend";
            var audio = new Audio(status + '.mp3');
            audio.play();
        }
        status = "bend"
    } else if (prediction[2].probability.toFixed(2) >= 0.99) {
        if (status == "prone" || status == "bend" || status == "narrow") {
            status = "right";
            var audio = new Audio(status + '.mp3');
            audio.play();
        }
        status = "right"
    } else if (prediction[3].probability.toFixed(2) >= 0.99) {
        if (status == "prone" || status == "right" || status == "bend") {
            status = "narrow";
            var audio = new Audio(status + '.mp3');
            audio.play();
        }
        status = "narrow"
    }
}

function drawPose(pose) {
    if (webcam.canvas) {
        ctx.drawImage(webcam.canvas, 0, 0);
        // draw the keypoints and skeleton
        if (pose) {
            const minPartConfidence = 0.5;
            tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
            tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
        }
    }
}
