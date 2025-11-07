import Utils from "../utils.js";

const agendaView = {
  async render(page) {
    const appElement = document.getElementById("app");

    const skeletonAgenda = `
      <div class="p-4 max-w-sm mx-auto space-y-6">
        <div class="animate-pulse flex items-center justify-between">
          <div class="flex-grow mr-4">
            <div class="h-5 w-1/4 bg-gray-300 rounded"></div>
            <div class="mt-2 h-4 w-1/3 bg-gray-300 rounded"></div>
          </div>
          <div class="h-10 w-10 bg-gray-300 rounded-full"></div>
        </div>
        <div class="bg-white rounded-xl p-5 space-y-2 animate-pulse">
          <div class="flex justify-between items-center mb-4">
            <div class="h-6 w-1/3 bg-gray-300 rounded"></div>
            <div class="flex items-center space-x-2">
              <div class="h-9 w-9 bg-gray-200 rounded-md"></div>
              <div class="h-9 w-16 bg-gray-200 rounded-md"></div>
              <div class="h-9 w-9 bg-gray-200 rounded-md"></div>
              <div class="h-11 w-11 bg-gray-300 rounded-lg"></div>
            </div>
          </div>
          <div class="grid grid-cols-7 gap-2">
            <div class="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
            <div class="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
            <div class="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
            <div class="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
            <div class="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
            <div class="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
            <div class="h-4 w-8 bg-gray-200 rounded mx-auto"></div>
          </div>
          <div class="grid grid-cols-7 gap-3">
            <div class="w-10 h-10 bg-gray-100 rounded-md mx-auto"></div>
            <div class="w-10 h-10 bg-gray-100 rounded-md mx-auto"></div>
            <div class="w-10 h-10 bg-gray-200 rounded-md mx-auto"></div>
            <div class="w-10 h-10 bg-gray-200 rounded-md mx-auto"></div>
            <div class="w-10 h-10 bg-gray-300 rounded-md mx-auto"></div>
            <div class="w-10 h-10 bg-gray-200 rounded-md mx-auto"></div>
            <div class="w-10 h-10 bg-gray-200 rounded-md mx-auto"></div>
          </div>
        </div>
        <div class="flex items-center space-x-3 animate-pulse">
          <div class="h-12 w-28 bg-gray-300 rounded-lg"></div>
          <div class="h-12 flex-grow bg-gray-200 rounded-lg"></div>
        </div>

        <div class="space-y-4 animate-pulse pt-6">

          <div class="flex items-center space-x-3">
            <div class="h-6 w-6 bg-gray-300 rounded-full"></div>
            <div class="h-5 w-1/4 bg-gray-300 rounded"></div>
          </div>

          <div class="bg-white rounded-xl p-4">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div class="flex-grow space-y-2">
                <div class="h-4 w-3/4 bg-gray-300 rounded"></div>
                <div class="h-3 w-1/2 bg-gray-200 rounded"></div>
                <div class="h-3 w-5/6 bg-gray-200 rounded"></div>
              </div>
              <div class="flex flex-col items-end space-y-2 flex-shrink-0">
                <div class="h-6 w-24 bg-gray-300 rounded-full"></div>
                <div class="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl p-4">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div class="flex-grow space-y-2">
                <div class="h-4 w-3/4 bg-gray-300 rounded"></div>
                <div class="h-3 w-1/2 bg-gray-200 rounded"></div>
                <div class="h-3 w-5/6 bg-gray-200 rounded"></div>
              </div>
              <div class="flex flex-col items-end space-y-2 flex-shrink-0">
                <div class="h-6 w-24 bg-gray-300 rounded-full"></div>
                <div class="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-3 pt-4">
            <div class="h-6 w-6 bg-gray-300 rounded-full"></div>
            <div class="h-5 w-1/4 bg-gray-300 rounded"></div>
          </div>
          
          <div class="bg-white rounded-xl p-4">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div class="flex-grow space-y-2">
                <div class="h-4 w-3/4 bg-gray-300 rounded"></div>
                <div class="h-3 w-1/2 bg-gray-200 rounded"></div>
                <div class="h-3 w-5/6 bg-gray-200 rounded"></div>
              </div>
              <div class="flex flex-col items-end space-y-2 flex-shrink-0">
                <div class="h-6 w-24 bg-gray-300 rounded-full"></div>
                <div class="h-4 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const skeletonTimer = setTimeout(() => {
      appElement.innerHTML = skeletonAgenda;
    }, 1000);

    try {
      const response = await fetch(`pages/${page}.html`);
      if (!response.ok) throw new Error("Página não encontrada");

      const html = await response.text();

      clearTimeout(skeletonTimer);

      appElement.innerHTML = html;
    } catch (err) {
      clearTimeout(skeletonTimer);
      showOfflineModal();
    }
  },
};

export default agendaView;
