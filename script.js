// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose
// the link to your model provided by Teachable Machine export panel 경로

let video = document.getElementById("#videoInput"); // video is the id of video tag
navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function(stream) {
        video.srcObject = stream;
        video.play();
    })
    .catch(function(err) {
        console.log("An error occurred! " + err);
    });

    let canvasFrame = document.getElementById("#canvasFrame"); // canvasFrame is the id of <canvas>
let context = canvasFrame.getContext("2d");
let src = new cv.Mat(height, width, cv.CV_8UC4);
let dst = new cv.Mat(height, width, cv.CV_8UC1);
const FPS = 30;
function processVideo() {
    let begin = Date.now();
    context.drawImage(video, 0, 0, width, height);
    src.data.set(context.getImageData(0, 0, width, height).data);
    cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
    cv.imshow("#canvasOutput", dst); // canvasOutput is the id of another <canvas>;
    // schedule next one.
    let delay = 1000/FPS - (Date.now() - begin);
    setTimeout(processVideo, delay);
}
// schedule first one.
setTimeout(processVideo, 0);




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
