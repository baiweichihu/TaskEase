import { useEffect, useRef, useState } from "react";

const EXIT_MS = 240;

export function ModalShell({
  isOpen,
  onClose,
  children,
  backdropZIndex = 1040,
  modalZIndex = 1050,
  dialogClassName,
  dialogStyle,
  modalClassName = "",
  closeOnBackdrop = false,
  role,
  ariaModal,
  ariaLabelledby,
}) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsRendered(true);
      setIsClosing(false);
      return;
    }

    if (!isRendered) return;

    setIsClosing(true);
    timerRef.current = window.setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      timerRef.current = null;
    }, EXIT_MS);
  }, [isOpen, isRendered]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  function requestClose() {
    if (isClosing) return;
    setIsClosing(true);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setTimeout(() => {
      onClose?.();
      timerRef.current = null;
    }, EXIT_MS);
  }

  if (!isRendered) return null;

  const modalAnimationClass = isClosing ? "taskease-modal-exit" : "taskease-modal-enter";
  const backdropAnimation = isClosing ? "fadeOut 0.24s ease-in forwards" : "fadeIn 0.3s ease-in-out";
  const content = typeof children === "function" ? children(requestClose) : children;

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: backdropZIndex,
          animation: backdropAnimation,
        }}
        onClick={closeOnBackdrop ? requestClose : undefined}
      />
      <div
        className={`modal d-block ${modalAnimationClass} ${modalClassName}`.trim()}
        tabIndex="-1"
        style={{ zIndex: modalZIndex }}
        role={role}
        aria-modal={ariaModal}
        aria-labelledby={ariaLabelledby}
      >
        {dialogClassName ? (
          <div className={dialogClassName} style={dialogStyle}>
            {content}
          </div>
        ) : (
          content
        )}
      </div>
    </>
  );
}
