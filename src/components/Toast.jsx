export function Toast({ notice, onClose }) {
  if (!notice?.text) return null;

  return (
    <div className="position-fixed top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 1080, minWidth: "360px", maxWidth: "88vw" }}>
      <div className={`alert ${notice.warning ? "alert-danger" : "alert-success"} shadow-sm py-2 mb-0 d-flex justify-content-between align-items-center`}>
        <span>{notice.text}</span>
        <button className="btn-close ms-2" type="button" onClick={onClose} aria-label="close" />
      </div>
    </div>
  );
}
