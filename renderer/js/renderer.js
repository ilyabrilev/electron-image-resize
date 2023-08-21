const form = document.querySelector('#img-form');
const img = document.querySelector('#img');
const outputPath = document.querySelector('#output-path');
const filename = document.querySelector('#filename');
const heightInput = document.querySelector('#height');
const widthInput = document.querySelector('#width');

function loadImage(e) {
    const file = e.target.files[0];

    if (!isFileImage(file)) {
        allertError('Please select an image');
        return;
    }

    // Get original dimensions
    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = function () {
        widthInput.value = this.width;
        heightInput.value = this.height;
    }

    form.style.display = 'block';
    filename.innerText = file.name;
    outputPath.innerText = path.join(os.homedir(), path.sep, 'Projects', path.sep, 'temp', path.sep, 'imageresizer');    
}

//send image data to main
function sendImage(e) {
    e.preventDefault();
    const width = widthInput.value;
    const height = heightInput.value;
    const imgPath = img.files[0].path;

    if (!img.files[0]) {
        allertError('Please upload an image');
        return;
    }

    if (width === '' || height === '') {
        allertError('Please fill in a height and width');
        return;
    }

    //send to main using ipcRenderer
    ipcRenderer.send('image:resize', {
        imgPath,
        width,
        height,
    });
}

//catch image:done event
ipcRenderer.on('image:done', () => {
    allertSuccess(`Image resized to ${widthInput.value} x ${heightInput.value}`);
});

function isFileImage(file) {
    const acceptedImageTypes = [
        'image/gif', 'image/png', 'image/jpeg'
    ];
    return file && acceptedImageTypes.includes(file['type']);
}

function allertError(message) {
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'red',
            color: 'white',
            textAlign: 'center',
        }
    });
}

function allertSuccess(message) {
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'green',
            color: 'white',
            textAlign: 'center',
        }
    });
}

img.addEventListener('change', loadImage);

form.addEventListener('submit', sendImage);