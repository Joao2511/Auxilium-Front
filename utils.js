class Utils {
  static showMessageToast(type, title, message, duration = 3000) {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast-shadow rounded-xl p-4 mb-3 transform transition-all duration-300 ease-in-out toast-${type} toast-slide-in`;
    toast.style.minWidth = "280px";
    toast.style.maxWidth = "320px";

    const icons = {
      success: '<i class="fas fa-check-circle mr-2"></i>',
      error: '<i class="fas fa-exclamation-circle mr-2"></i>',
      warning: '<i class="fas fa-exclamation-triangle mr-2"></i>',
    };

    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 text-lg">
          ${icons[type] || icons.info}
        </div>
        <div class="ml-3 flex-1">
          <p class="text-sm font-bold">${title}</p>
          <p class="text-xs opacity-90 mt-1">${message}</p>
        </div>
        <button class="ml-4 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    container.appendChild(toast);

    const removeToast = () => {
      toast.classList.remove("toast-slide-in");
      toast.classList.add("toast-fade-out");
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    toast.querySelector("button").addEventListener("click", removeToast);

    setTimeout(removeToast, duration);
  }

  /**
   * Shows a confirmation modal with customizable title, message and button texts
   * Uses the existing modal structure from the application
   * @param {string} title - Modal title
   * @param {string} message - Modal message
   * @param {string} confirmButtonText - Text for confirm button
   * @param {string} cancelButtonText - Text for cancel button
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  static showConfirmationModal(title, message, confirmButtonText = "Confirmar", cancelButtonText = "Cancelar") {
    return new Promise((resolve) => {
      const modalContainer = document.getElementById("confirm-atendimento-modal");
      
      if (!modalContainer) {
        // Fallback to native confirm if modal container doesn't exist
        const result = confirm(message);
        resolve(result);
        return;
      }

      // Clear the container first
      modalContainer.innerHTML = "";

      // Create the modal content
      const modalContent = document.createElement("div");
      modalContent.id = "modal-content";
      modalContent.className = "bg-white rounded-t-2xl shadow-lg w-full animate-slide-up transform transition-all duration-300 ease-out";
      modalContent.innerHTML = `
        <div class="w-full flex justify-center mt-2">
          <div class="h-1.5 w-12 bg-gray-300 rounded-full"></div>
        </div>
        <div class="py-8 px-6 space-y-6">
          <div class="text-center space-y-2">
            <h3 class="text-2xl font-bold text-gray-900">${title}</h3>
            <p class="text-gray-600 text-sm leading-5">${message}</p>
          </div>
          <div class="flex flex-col gap-2">
            <button id="confirm-action" class="w-full py-3 text-white bg-[#8E24AA] rounded-full font-semibold hover:bg-[#4d135c] transition-colors">
              ${confirmButtonText}
            </button>
            <button id="cancel-action" class="w-full py-3 text-[#8E24AA] bg-transparent font-medium hover:bg-gray-100 rounded-full transition-colors">
              ${cancelButtonText}
            </button>
          </div>
        </div>
      `;

      // Append the content to the container
      modalContainer.appendChild(modalContent);

      // Show the modal
      document.body.classList.add("no-scroll");
      modalContainer.classList.remove("hidden");

      // Get references to the elements
      const modal = document.getElementById("confirm-atendimento-modal");
      const confirmButton = document.getElementById("confirm-action");
      const cancelButton = document.getElementById("cancel-action");

      function closeModal() {
        document.body.classList.remove("no-scroll");
        if (modalContent) modalContent.classList.add("animate-slide-down");
        setTimeout(() => {
          modal?.classList.add("hidden");
          modalContent?.classList.remove("animate-slide-down");
          if (modalContent) modalContent.style.transform = "";
        }, 300);
      }

      // Close modal when clicking on the backdrop
      const handleBackdropClick = (e) => {
        if (e.target === modal) {
          closeModal();
          resolve(false);
        }
      };

      // Cancel button handler
      const handleCancel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        modal.removeEventListener("click", handleBackdropClick);
        cancelButton.removeEventListener("click", handleCancel);
        confirmButton.removeEventListener("click", handleConfirm);
        closeModal();
        resolve(false);
      };

      // Confirm button handler
      const handleConfirm = (e) => {
        e.preventDefault();
        e.stopPropagation();
        modal.removeEventListener("click", handleBackdropClick);
        cancelButton.removeEventListener("click", handleCancel);
        confirmButton.removeEventListener("click", handleConfirm);
        closeModal();
        resolve(true);
      };

      // Attach event listeners
      modal.addEventListener("click", handleBackdropClick);
      cancelButton.addEventListener("click", handleCancel);
      confirmButton.addEventListener("click", handleConfirm);
    });
  }
}

export default Utils;