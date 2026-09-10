import ImageUpload from "../../components/ImageUpload/ImageUpload";

function UploadPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Upload Image</h1>

          <p>Upload an image and let AI detect faces automatically.</p>
        </div>
      </div>

      <ImageUpload />
    </div>
  );
}

export default UploadPage;
