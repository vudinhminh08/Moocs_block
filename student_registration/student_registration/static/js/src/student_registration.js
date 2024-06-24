/* Javascript for StudentRegistrationXBlock. */
function StudentRegistrationXBlock(runtime, element) {

}
$(document).ready(function () {
  var imageLists = [];
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

  var missingLabels = [];
  var missingGif = [];
  var checkNumberImages = setInterval(() => {
    if (imageLists.length >= 5) {
      $(".sefid_container_main_buttons_container").css("display", "block");
      $("#sefid_container_intruction").text("");
      $("#take-photo").prop("disabled", true);
      $(".sefid_container_demo").css("display", "none");
    } else {
      $(".sefid_container_demo").css("display", "block");
      $(".sefid_container_main_buttons_container").css("display", "none");
      $("#take-photo").prop("disabled", false);
      $("#sefid_container_intruction").html(missingLabels[0]);
      $("#sefid_container .sefid_container_demo img").attr("src", missingGif[0]);
      let existingGifs = imageLists.map((item) => item.gifURL);
      missingGif = gifs.filter((item) => !existingGifs.includes(item));
      let existingLabels = imageLists.map((item) => item.title);
      missingLabels = labels.filter((item) => !existingLabels.includes(item));
    }
  }, 10);

  navigator.getMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;
  let mediaStream = null;
  if (!navigator.getMedia) {
    displayErrorMessage(
      "Your browser doesn't have support for the navigator.getUserMedia interface."
    );
  } else {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((localMediaStream) => {
        mediaStream = localMediaStream;
        $("#sefid_container_main_part1_camera").prop("srcObject", localMediaStream);
        $("#sefid_container_main_part1_camera").get(0).play();
      })
      .catch((err) => {
        console.error(`Oh no, there's an error`, err);
      });
  }
  function stopWebcam() {
    if (mediaStream) {
      const tracks = mediaStream.getTracks();
      tracks.forEach(function (track) {
        track.stop();
      });
      video.srcObject = null;
    }
  }
  $("#sefid_container_main_part1_canvas").attr("width", 320);
  $("#sefid_container_main_part1_canvas").attr("height", 240);

  $("#take-photo").on("click", function (event) {
    event.preventDefault();
    takePicture();
  });

  $(document).on("keypress", function (event) {
    if (imageLists.length <= 4) {
      if (event.key === "Enter" || event.key === " ") {
        takePicture();
      }
    }
  });
  const selfidGallerry = document.getElementById("sefid_container_main_gallery");
  const video = document.getElementById("sefid_container_main_part1_camera");
  const imageProcessor = document.getElementById(
    "sefid_container_main_part1_canvas"
  );
  const intruction = document.getElementById("sefid_container_intruction");
  const intructionGif = document.querySelector(
    "#sefid_container .sefid_container_demo img"
  );
  const demo = document.querySelector("#sefid_container .sefid_container_demo");
  imageProcessor.width = 320;
  imageProcessor.height = 240;
  function takePicture() {
    // e.preventDefault();
    var context = imageProcessor.getContext("2d");
    video.classList.add("fade-in");
    context.drawImage(video, 0, 0, imageProcessor.width, imageProcessor.height);
    setTimeout(() => video.classList.remove("fade-in"), 500);
    var imageURL = imageProcessor.toDataURL();
    var temp = document.createElement("div");
    temp.innerHTML = `<img src="${imageURL}">
              <button  id="${imageURL}" title="Delete Photo")">
                 <i class="material-icons">delete</i>
               </button>`;
    selfidGallerry.appendChild(temp);
    document.getElementById(imageURL).addEventListener("click", (event) => {
      event.preventDefault();
      DeletePose(event, temp, imageURL);
    });
    imageLists.push({
      title: `${missingLabels[0]}`,
      imageURL: imageURL,
      gifURL: `${missingGif[0]}`,
    });

    intruction.innerHTML = missingLabels[1];
    intructionGif.setAttribute("src", missingGif[1]);
  }

  function DeletePose(event, element, imageURL) {
    event.preventDefault();
    element.remove();
    imageLists = imageLists.filter((item) => item.imageURL != imageURL);
  }

  $("#submit").on("click", function () {
    Submit();
  });

  function Submit() {
    var url = "https://aiserver.daotao.ai/api/students/create";
    var dataSend = imageLists.map((item) => item.imageURL);
    var data = {
      id: "20194817",
      portraits: dataSend,
    };

    $.ajax({
      type: "POST",
      url: url,
      data: JSON.stringify(data),
      contentType: "application/json",
      success: function (response) {
        console.log("Photos uploaded successfully!");
        alert('Register Completed!');
        console.log(response);
        window.location.href = "../../StudentFaceAttendance/index.html";
      },
      error: function (xhr, status, error) {
        console.error("Error uploading photos." + xhr.responseText);
      },
    });

    clearInterval(checkNumberImages);
    $(".sefid_container_main_buttons_container #submit").prop("disabled", true);

    stopWebcam();
  }
});
