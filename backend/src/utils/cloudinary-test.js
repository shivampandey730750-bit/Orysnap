import { v2 as cloudinary } from 'cloudinary';

// 1. Configure Cloudinary inline
cloudinary.config({
  cloud_name: 'ecwxkeog',
  api_key: '228775256267637',
  api_secret: '9XLr2EJ2Il9Zmglbi4WPN2eYpK4'
});

async function run() {
  try {
    console.log('Uploading sample image to Cloudinary...');
    
    // 2. Upload an image from Cloudinary demo domain
    const uploadResult = await cloudinary.uploader.upload('https://res.cloudinary.com/demo/image/upload/sample.jpg', {
      public_id: 'onboarding_sample'
    });
    
    console.log('Upload Successful!');
    console.log('Secure URL:', uploadResult.secure_url);
    console.log('Public ID:', uploadResult.public_id);
    
    // 3. Get image details
    const details = await cloudinary.api.resource(uploadResult.public_id);
    console.log('Image Details:');
    console.log(`Width: ${details.width}px`);
    console.log(`Height: ${details.height}px`);
    console.log(`Format: ${details.format}`);
    console.log(`File Size: ${details.bytes} bytes`);
    
    // 4. Transform the image
    // f_auto: Automatically selects the best image format for the requesting browser (e.g. WebP or AVIF)
    // q_auto: Automatically optimizes the image quality to reduce file size while maintaining visual quality
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: 'auto',
      quality: 'auto'
    });
    
    console.log('\nDone! Click link below to see optimized version of the image. Check the size and the format.');
    console.log(transformedUrl);
    
  } catch (error) {
    console.error('Error during onboarding script run:', error);
  }
}

run();
