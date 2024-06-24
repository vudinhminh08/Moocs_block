/* Javascript for StudentAttendanceXBlock. */
function StudentAttendanceXBlock(runtime, element) {

}

$(document).ready(function() {
    const video = $('#sefid_container_main_part1_camera').get(0);
    let imageDataURL = '';
    const takePhotoBtn = $('#take-photo');
    takePhotoBtn.css('display', 'block');
    const reTakePhotoBtn = $('#re-take-photo');
    reTakePhotoBtn.css('display', 'none');
    let mediaStream = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
          mediaStream = stream
          video.srcObject = stream;
          video.play();
        })
        .catch(function(error) {
          console.error('Unable to access the webcam: ', error);
        });
    } else {
      console.error('Webcam access is not supported in this browser.');
    }

    function stopWebcam() {
      if (mediaStream) {
        const tracks = mediaStream.getTracks();
        tracks.forEach(function(track) {
          track.stop();
        });
        video.srcObject = null;
      }
    }

    $('#take-photo').on('click', function() {
      takePhoto();
    });
  
    $('#re-take-photo').on('click', function() {
      video.play();
      takePhotoBtn.css('display', 'block');
      reTakePhotoBtn.css('display', 'none');
    });
  
    function takePhoto() {
      if (!video.paused) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
  
        canvas.width = 320;
        canvas.height = 240;
  
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
        imageDataURL = canvas.toDataURL('image/png');
        video.pause();
        takePhotoBtn.css('display', 'none');
        reTakePhotoBtn.css('display', 'block');
      } else {
        video.play();
        takePhotoBtn.css('display', 'block');
        reTakePhotoBtn.css('display', 'none');
      }
    }
  
    $('#submit').on('click', function() {
      submit();
    });
  
    function submit() {
  
  
      const url = 'https://aiserver.daotao.ai/api/attendance/create';
      $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify({
          student_id: "",
          class_id: "",
          portrait: imageDataURL
        }),
        contentType: 'application/json',
        success: function(response) {
          console.log('Photos uploaded successfully!');
          localStorage.setItem('attendance_id', response.id);
          localStorage.setItem('student_id', response.student_id);
          window.location.href = '../../StudentExamination/index.html';
        },
        error: function(xhr, status, error) {
          if (xhr.status === 404) {
            alert('Please register face first!');
            window.location.href = '../../StudentFaceRegistration/html/index.html';
          } else {
            console.error('Error uploading photos: ' + xhr.status);
          }
        }
      });
  
      $('#submit').prop('disabled', true);
      stopWebcam();
    }
  });
  
