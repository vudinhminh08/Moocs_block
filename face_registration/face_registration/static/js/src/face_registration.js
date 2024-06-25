/* Javascript for FaceRegistrationXBlock. */
class WebcamFaceRegistration {
    constructor(webcamElement, facingMode = 'user', canvasElement = null, snapSoundElement = null) {
        this._webcamElement = webcamElement;
        this._webcamElement.width = this._webcamElement.width || 640;
        this._webcamElement.height = this._webcamElement.height || 360;
        this._facingMode = facingMode;
        this._webcamList = [];
        this._streamList = [];
        this._selectedDeviceId = '';
        this._canvasElement = canvasElement;
        this._snapSoundElement = snapSoundElement;
    }

    get facingMode() {
        return this._facingMode;
    }

    set facingMode(value) {
        this._facingMode = value;
    }

    get webcamList() {
        return this._webcamList;
    }

    get webcamCount() {
        return this._webcamList.length;
    }

    get selectedDeviceId() {
        return this._selectedDeviceId;
    }

    /* Get all video input devices info */
    getVideoInputs(mediaDevices) {
        this._webcamList = [];
        mediaDevices.forEach(mediaDevice => {
            if (mediaDevice.kind === 'videoinput') {
                this._webcamList.push(mediaDevice);
            }
        });
        if (this._webcamList.length == 1) {
            this._facingMode = 'user';
        }
        return this._webcamList;
    }

    /* Get media constraints */
    getMediaConstraints() {
        var videoConstraints = {};
        if (this._selectedDeviceId == '') {
            videoConstraints.facingMode = this._facingMode;
        } else {
            videoConstraints.deviceId = { exact: this._selectedDeviceId };
        }
        videoConstraints.width = { exact: this._webcamElement.width };
        videoConstraints.height = { exact: this._webcamElement.height };
        var constraints = {
            video: videoConstraints,
            audio: false
        };
        return constraints;
    }

    /* Select camera based on facingMode */
    selectCamera() {
        for (let webcam of this._webcamList) {
            if ((this._facingMode == 'user' && webcam.label.toLowerCase().includes('front'))
                || (this._facingMode == 'environment' && webcam.label.toLowerCase().includes('back'))
            ) {
                this._selectedDeviceId = webcam.deviceId;
                break;
            }
        }
    }

    /* Change Facing mode and selected camera */
    flip() {
        this._facingMode = (this._facingMode == 'user') ? 'environment' : 'user';
        this._webcamElement.style.transform = "";
        this.selectCamera();
    }

    /*
      1. Get permission from user
      2. Get all video input devices info
      3. Select camera based on facingMode 
      4. Start stream
    */
    async start(startStream = true) {
        return new Promise((resolve, reject) => {
            this.stop();
            navigator.mediaDevices.getUserMedia(this.getMediaConstraints()) //get permisson from user
                .then(stream => {
                    this._streamList.push(stream);
                    this.info() //get all video input devices info
                        .then(webcams => {
                            this.selectCamera();   //select camera based on facingMode
                            if (startStream) {
                                this.stream()
                                    .then(facingMode => {
                                        resolve(this._facingMode);
                                    })
                                    .catch(error => {
                                        reject(error);
                                    });
                            } else {
                                resolve(this._selectedDeviceId);
                            }
                        })
                        .catch(error => {
                            reject(error);
                        });
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /* Get all video input devices info */
    async info() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.enumerateDevices()
                .then(devices => {
                    this.getVideoInputs(devices);
                    resolve(this._webcamList);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    /* Start streaming webcam to video element */
    async stream() {
        return new Promise((resolve, reject) => {
            navigator.mediaDevices.getUserMedia(this.getMediaConstraints())
                .then(stream => {
                    this._streamList.push(stream);
                    this._webcamElement.srcObject = stream;
                    if (this._facingMode == 'user') {
                        this._webcamElement.style.transform = "scale(-1,1)";
                    }
                    this._webcamElement.play();
                    resolve(this._facingMode);
                })
                .catch(error => {
                    console.log(error);
                    reject(error);
                });
        });
    }

    /* Stop streaming webcam */
    stop() {
        this._streamList.forEach(stream => {
            stream.getTracks().forEach(track => {
                track.stop();
            });
        });
    }

    snap() {
        if (this._canvasElement != null) {
            if (this._snapSoundElement != null) {
                this._snapSoundElement.play();
            }
            this._canvasElement.height = this._webcamElement.scrollHeight;
            this._canvasElement.width = this._webcamElement.scrollWidth;
            let context = this._canvasElement.getContext('2d');
            if (this._facingMode == 'user') {
                context.translate(this._canvasElement.width, 0);
                context.scale(-1, 1);
            }
            context.clearRect(0, 0, this._canvasElement.width, this._canvasElement.height);
            context.drawImage(this._webcamElement, 0, 0, this._canvasElement.width, this._canvasElement.height);
            let data = this._canvasElement.toDataURL('image/jpeg');
            return data;
        }
        else {
            throw "canvas element is missing";
        }
    }
}


function FaceRegistrationXBlock(runtime, element) {

    const MODEL_URL = "/static/models";
    const webcamElement = document.getElementById('webcam');
    const canvasElement = document.getElementById('canvas');
    const snapSoundElement = document.getElementById('snapSound');
    const snapButtonElement = document.getElementById('capture-button');
    const webcam = new WebcamFaceRegistration(webcamElement, 'user', canvasElement, snapSoundElement);
    const statusElement = document.getElementById('status');
    var checkImgs = [false, false, false, false, false];
    var imageData = new Array(5);
    var imageLists = new Array(5);
    var imageDescriptor = new Array(5);
    var currentImageIndex = 0;
    var student_id = ''
    const DATA_RAW = [
        { index: 0, ryMin: -0.06, ryMax: 0.02, rxMin: 0, rxMax: 0.15 },
        { index: 1, ryMin: -Infinity, ryMax: -0.03, rxMin: -0.1, rxMax: 0.15 },
        { index: 2, ryMin: 0.02, ryMax: Infinity, rxMin: -0.1, rxMax: 0.15 },
        { index: 3, ryMin: -0.06, ryMax: 0.02, rxMin: 0.13, rxMax: Infinity },
        { index: 4, ryMin: -0.06, ryMax: 0.02, rxMin: -Infinity, rxMax: 0.02 }
    ];
    const labels = [
        "Please put your face straight into the camera!",
        "Please turn your face right!",
        "Please turn your face left!",
        "Please turn your face up!",
        "Please turn your face down!",
    ];
    const gifs = [
        "https://i.gifer.com/3OYiI.gif",
        "https://i.gifer.com/3OYiE.gif",
        "https://i.gifer.com/3OYiG.gif",
        "https://i.gifer.com/3OYiF.gif",
        "https://i.gifer.com/3OYiH.gif",
    ];

    const captureButton = document.getElementById("capture-button");
    const confirmButton = document.getElementById("confirm-button");
    const titleInstruction = document.getElementById("title-instruction");
    const imgElement = document.getElementById("image-instruction");
    const exampleElement = document.getElementById("example");
    const currentUrl = window.location.href;
    const match = currentUrl.match(/courses\/([^/]+)/);
    const class_id = match ? match[1] : null;
    userInfo = {}
    const getUser = function () {
        var handlerUrl = runtime.handlerUrl(element, 'get_user_info');
        $.ajax({
            type: "POST",
            url: handlerUrl,
            data: JSON.stringify({}),
            success: getUserFromBackend
        });
    }
    const getUserFromBackend = function (res) {
        userInfo = res.user_info;
        email = res.user_info.email
        const match = email.match(/\d+(?=@)/);
        if (match) {
            const number = match[0]; // Lấy phần số từ kết quả match
            student_id = `20${number}`; // Thêm số 20 đằng trước
        } else {
            console.log('Can not find student ID');
        }
    }
    getUser();
    async function login() {
        var settings = {
            "url": "http://localhost:3333/api/v1/login/access-token",
            "method": "POST",
            "timeout": 0,
            "headers": {
                "accept": "application/json",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "data": {
                "grant_type": "",
                "username": "edtech",
                "password": "hMJzj6Vb79WB",
                "scope": "",
                "client_id": "",
                "client_secret": ""
            }
        };
        return new Promise((resolve, reject) => {
            $.ajax(settings).done(function (response) {
                resolve(response);
            }).fail(function (jqXHR, textStatus, errorThrown) {
                reject(new Error('AJAX Error: ' + textStatus + ': ' + errorThrown));
            });
        });
    }
    var accessToken
    async function getAccessToken() {
        try {
            const response = await login();
            accessToken = response.access_token;
            return accessToken;
        } catch (error) {
            console.error("Failed to login and get access token:", error);
        }
    }
    getAccessToken();
    setInterval(function () {
        if (checkImgs.every(element => element)) {
            captureButton.style.display = "none";
            captureButton.disabled = true;
            confirmButton.style.display = "block";
            confirmButton.disabled = false;
            titleInstruction.innerText = "Please confirm your portraits";
            exampleElement.style.display = "none";
        }
        else {
            captureButton.style.display = "block";
            captureButton.disabled = false;
            confirmButton.style.display = "none";
            confirmButton.disabled = true;
            exampleElement.style.display = "block";
        }
    }, 100);

    function setInstruction(index) {
        titleInstruction.innerText = labels[index];
        imgElement.src = gifs[index]
    }
    $(document).ready(function () {
        // need to get the student ID

        Promise.all([
            faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]).then(startWebcam);
        setInstruction(currentImageIndex)
    });

    function startWebcam() {
        webcam.start()
            .then(result => {
                console.log("webcam started");
            })
            .catch(err => {
                console.log(err);
            });
    }
    webcamElement.addEventListener("play", () => {
        canvas = faceapi.createCanvas(webcamElement);
        document.body.append(canvas);
        const displaySize = {
            width: webcamElement.width,
            height: webcamElement.height,
        };
        faceapi.matchDimensions(canvas, displaySize);

        setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(webcamElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks();
            var check_position_head = 0;
            if (detections.length > 0) {
                let x_head = detections[0].detection._box._x;
                let y_head = detections[0].detection._box._y;
                let area_head = detections[0].detection._box.area;
                if (
                    x_head < displaySize.width / 6 ||
                    y_head < displaySize.height / 6 ||
                    x_head > displaySize.width / 1.8 ||
                    y_head > displaySize.height / 1.8 ||
                    area_head < (displaySize.width * displaySize.height) / 14 ||
                    area_head > (displaySize.width * displaySize.height) / 2
                ) {
                    check_position_head = check_position_head + 1;
                    if (check_position_head >= 1) {
                        statusElement.textContent = 'You need to put your head in the middle of the camera';
                        statusElement.className = 'error';
                    }
                } else {
                    check_position_head--;
                    if (check_position_head < 1) {
                        statusElement.textContent = 'Correct head position';
                        statusElement.className = 'correct';
                    }
                }
            }
        }, 100);
    });
    function getMeanPosition(l) {
        return l
            .map((a) => [a.x, a.y])
            .reduce((a, b) => [a[0] + b[0], a[1] + b[1]])
            .map((a) => a / l.length);
    }
    function getTop(l) {
        return l.map((a) => a.y).reduce((a, b) => Math.min(a, b));
    }
    function detectHeadpose(res) {
        let state_img = "CAN_NOT_DETECT";
        if (res) {
            var eye_right = getMeanPosition(res.landmarks.getRightEye());
            var eye_left = getMeanPosition(res.landmarks.getLeftEye());
            var nose = getMeanPosition(res.landmarks.getNose());
            var mouth = getMeanPosition(res.landmarks.getMouth());
            var jaw = getTop(res.landmarks.getJawOutline());

            var rx = (jaw - mouth[1]) / res.detection.box.height + 0.5;
            var ry =
                (eye_left[0] + (eye_right[0] - eye_left[0]) / 2 - nose[0]) /
                res.detection.box.width;
            if (res.detection.score > 0.65) {
                state_img = 0;
                for (let data of DATA_RAW) {
                    if (currentImageIndex == data.index &&
                        ry > data.ryMin && ry < data.ryMax &&
                        rx > data.rxMin && rx < data.rxMax) {
                        return currentImageIndex;
                    }
                }
                return -3;
            }
        } else {
            let expressions = res.expressions;
            let isFaceExpression = Object.values(expressions).some((x) => x > 0.9);
            if (!isFaceExpression || res[0].landmarks.positions.length < 67) {
                state = "UNCLEAR_FACE";
            }
        }
        return state_img;
    }
    async function detect(detections) {

        if (detections == undefined) {
            return -2
        }
        const peopleCount = detections.length;
        if (peopleCount == 0) {
            return -2
        }
        else if (peopleCount == 1) {
            var state = detectHeadpose(detections[0]);
            return state
        }
        else {
            return -1
        }
    }
    async function capturePortrait() {
        snapButtonElement.disabled = true;
        var picture = webcam.snap();
        const base64Response = await fetch(picture);
        const blob = await base64Response.blob();

        const img = await faceapi.bufferToImage(blob);

        // preprocessing(img);
        const detections = await faceapi
            .detectAllFaces(img, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptors();

        const state = await detect(detections)

        if (state < 0) {
            console.log("state, currentImageIndex: ", state, currentImageIndex);
            alert("INCORRECT POSITION, TAKE A PHOTO AGAIN")
            return
        }

        if (currentImageIndex >= 1) {
            let distance = faceapi.euclideanDistance(
                detections[0].descriptor,
                imageDescriptor[0]
            );
            if (distance > 0.5) {
                alert("NOT MATCH FACE")
                return
            }
        }

        const imageContainer = document.getElementById('image-container');
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'image-wrapper';
        imageWrapper.appendChild(img);

        // Tạo nút xóa
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';
        deleteButton.innerHTML = `<i class="fa fa-trash-o" aria-hidden="true"></i>`;
        deleteButton.addEventListener('click', function () {
            var index = imageLists.indexOf(imageWrapper);
            if (index == 0) {
                checkImgs = [false, false, false, false, false];
                imageLists = new Array(5);
                imageDescriptor = new Array(5);
                currentImageIndex = 0;
                imageContainer.innerHTML = '';
                setInstruction(currentImageIndex);
                return
            }
            imageContainer.removeChild(imageWrapper);
            if (index !== -1) {
                imageLists[index] = undefined;
                checkImgs[index] = false;
            }
            currentImageIndex = checkImgs.findIndex(element => !element);
            if (currentImageIndex != -1) {
                setInstruction(currentImageIndex);
            }
        });
        imageWrapper.appendChild(deleteButton);

        // Thêm ảnh vào container
        imageContainer.appendChild(imageWrapper);
        imageLists[currentImageIndex] = imageWrapper;
        imageDescriptor[currentImageIndex] = detections[0].descriptor

        checkImgs[currentImageIndex] = true;
        currentImageIndex = checkImgs.findIndex(element => !element);
        if (currentImageIndex != -1) {
            setInstruction(currentImageIndex);
        }
        snapButtonElement.disabled = false;
    }


    $("#capture-button").click(capturePortrait);
    $("#confirm-button").click(function () {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'http://localhost:3333/api/v1/students');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        xhr.setRequestHeader('Access-Control-Allow-Headers', '*');
        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                // Parse the response data
                var data = JSON.parse(xhr.responseText);
            } else if (xhr.readyState === 4 && xhr.status !== 200) {
                console.error('Error:', xhr.status);
            }
        };
        for (var img in imageLists) {
            var imgElement = imageLists[img].querySelector("img");
            var imageSrc = imgElement.src;
            imageData[img] = imageSrc;
        }
        var data = JSON.stringify({
            student_id: student_id,
            portraits: imageData,
        });
        xhr.send(data);
    });

    $(function ($) {
        /* Here's where you'd do things on page load. */
    });


}
