import Camera from "../../components/Camera/Camera";

function CameraPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Live Camera</h1>

          <p>Detect faces in real-time using your webcam.</p>
        </div>
      </div>

      <Camera />
    </div>
  );
}

export default CameraPage;
