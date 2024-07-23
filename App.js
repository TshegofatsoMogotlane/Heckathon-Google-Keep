// Initializing the app when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new App(); // Instantiate your App class
  const themeSelector = document.getElementById('themeSelector');
  const viewModeSelector = document.getElementById('viewModeSelector');

  // Event listener for theme selector change
  themeSelector.addEventListener('change', function() {
    const selectedTheme = this.value;
    app.setTheme(selectedTheme); // Call App method to set the theme
  });
  // Event listener for view mode selector change
  viewModeSelector.addEventListener('change', function() {
    const selectedViewMode = this.value;
    app.setViewMode(selectedViewMode); // Call App method to set the view mode
  });
});

class Note {
    constructor(id, title, text, collaborators = [], labels = []) {
      this.id = id;
      this.title = title;
      this.text = text;
      this.collaborators = collaborators;
      this.labels = labels;
    }
  }
  
  class App {
    constructor() {
      localStorage.setItem("test", JSON.stringify(["123"]));
      this.notes = JSON.parse(localStorage.getItem('notes')) || [];
      console.log(this.notes);
      this.notes = [new Note("abc1", "test title", "test text")];
      this.selectedNoteId = "";
      this.miniSidebar = true;
  
      this.$activeForm = document.querySelector(".active-form");
      this.$inactiveForm = document.querySelector(".inactive-form");
      this.$noteTitle = document.querySelector("#note-title");
      this.$noteText = document.querySelector("#note-text");
      this.$notes = document.querySelector(".notes");
      this.$speechButton = document.querySelector("#speechButton");
      this.$form = document.querySelector("#form");
      this.$modal = document.querySelector(".modal");
      this.$modalForm = document.querySelector("#modal-form");
      this.$modalTitle = document.querySelector("#modal-title");
      this.$modalText = document.querySelector("#modal-text");
      this.$closeModalForm = document.querySelector("#modal-btn");
      this.$sidebar = document.querySelector(".sidebar");
      this.$sidebarActiveItem = document.querySelector(".active-item");
      this.$speechButton = document.querySelector('#speechButton');
      
      this.recognition = null;
  
      this.addEventListeners();
      this.displayNotes();

      this.synth = window.speechSynthesis;

      this.viewMode = "list";
      this.initializeTheme();
      this.initializeViewMode();
      this.fetchNotes(); 

      this.speaking = false;
      this.initializeSpeechSynthesis();
      this.initializeSpeechRecognition();
      this.addSpeechButtonListener();
    }
    addSpeechButtonListener() {
      if (this.$speechButton) {
        this.$speechButton.addEventListener('click', () => {
          this.startSpeechRecognition();
        });
      } else {
        console.error('Speech button not found');
      }
    }
    initializeSpeechRecognition() {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        // Creating new SpeechRecognition instance
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        
        // Setting recognition options if needed
        this.recognition.continuous = false;
        this.recognition.lang = 'en-US'; // Adjusting language as needed
  
        // Defining event handlers
        this.recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          this.handleSpeechInput(transcript);
        };
  
        this.recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };
      } else {
        console.error('Speech recognition not supported');
      }
    }
  
    startSpeechRecognition() {
      if (this.recognition) {
        this.recognition.start();
      } else {
        console.error('Speech recognition not initialized');
      }
    }
  
    stopSpeechRecognition() {
      if (this.recognition) {
        this.recognition.stop();
      }
    }
  
    handleSpeechInput(transcript) {
      // Handling speech input as needed
      this.$noteText.value = transcript; // Assuming $noteText is your textarea/input element
    }

    initializeSpeechSynthesis() {
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      } else {
        console.error('Speech synthesis not supported');
      }
    }
    speakText(text) {
      if (this.synth && !this.speaking) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        this.speaking = true;
        utterance.onend = () => {
          // Reseting speaking flag to false when speech ends
          this.speaking = false;
        };
        this.synth.speak(utterance);
      }
    }
    async fetchNotes() {
      try {
        const response = await fetch('/api/notes');
        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }
        const data = await response.json();
        this.notes = data.notes; // Update notes array with fetched data
        this.renderNotes(); // Render notes with updated data
      } catch (error) {
        console.error('Error fetching notes:', error.message);
      }
    }
    initializeViewMode() {
      const savedViewMode = localStorage.getItem('viewMode');
      this.setViewMode(savedViewMode || 'list'); // Default to list view if no saved mode found
    }
    setViewMode(mode) {
      this.viewMode = mode;
      this.render(); // Re-rendering notes based on the new view mode
  
      localStorage.setItem('viewMode', mode); // Saving view mode preference to localStorage
    }

      // Method to initialize theme based on stored preference or default
    initializeTheme() {
      const savedTheme = localStorage.getItem('theme');
      this.setTheme(savedTheme || 'light'); // Default to light theme if no saved theme found
    }

    // Method to set the theme
    setTheme(theme) {
      document.body.classList.toggle('dark-theme', theme === 'dark');
      localStorage.setItem('theme', theme); // Save theme preference to localStorage

      const modalContent = document.querySelector('.modal-content');
      modalContent.style.color = theme === 'dark' ? '#ffffff' : '#333333';
    }
  
    addEventListeners() {
      document.body.addEventListener("click", (event) => {
        this.handleFormClick(event);
        this.closeModal(event);
        this.openModal(event);
        this.handleArchiving(event);
        this.$notes.addEventListener('click', (event) => {
          const $note = event.target.closest('.note');
          if ($note && !this.speaking) {
            const noteId = $note.id;
            const note = this.notes.find(note => note.id === noteId);
            if (note) {
              const { title, text } = note;
              this.speakText(`${title}. ${text}`);
              
            }
          }
          
        });
        if (this.$speechButton) {
          this.$speechButton.addEventListener('click', () => {
            this.startSpeechRecognition();
          });
        } else {
          console.error('Speech button not found');
        }
      });
  
      this.$form.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = this.$noteTitle.value;
        const text = this.$noteText.value;
        const newNote = new Note(uuidv4(), title, text, [
          { userId: 'user1', avatar: 'avatar1.jpg' },
          { userId: 'user2', avatar: 'avatar2.jpg' },
        ]);
        this.addNote(newNote);
        this.addNote({ title, text });
        this.closeActiveForm();
      });
  
      this.$modalForm.addEventListener("submit", (event) => {
        event.preventDefault();
      });
  
      this.$sidebar.addEventListener("mouseover", (event) => {
        this.handleToggleSidebar();
      })
  
      this.$sidebar.addEventListener("mouseout", (event) => {
        this.handleToggleSidebar();
      })
  
    }
  
    handleFormClick(event) {
      const isActiveFormClickedOn = this.$activeForm.contains(event.target);
      const isInactiveFormClickedOn = this.$inactiveForm.contains(event.target);
      const title = this.$noteTitle.value;
      const text = this.$noteText.value;
  
      if (isInactiveFormClickedOn) {
        this.openActiveForm();
      } else if (!isInactiveFormClickedOn && !isActiveFormClickedOn) {
        this.addNote({ title, text });
        this.closeActiveForm();
      }
    }
  
    openActiveForm() {
      this.$inactiveForm.style.display = "none";
      this.$activeForm.style.display = "block";
      this.$noteText.focus();
    }
  
    closeActiveForm() {
      this.$inactiveForm.style.display = "block";
      this.$activeForm.style.display = "none";
      this.$noteText.value = "";
      this.$noteTitle.value = "";
    }
  
    openModal(event) {
      const $selectedNote = event.target.closest(".note");
      if ($selectedNote && !event.target.closest(".archive")) {
        this.selectedNoteId = $selectedNote.id;
        this.$modalTitle.value = $selectedNote.children[1].innerHTML;
        this.$modalText.value = $selectedNote.children[2].innerHTML;
        this.$modal.classList.add("open-modal");
      } else {
        return;
      }
    }
  
    closeModal(event) {
      const isModalFormClickedOn = this.$modalForm.contains(event.target);
      const isCloseModalBtnClickedOn = this.$closeModalForm.contains(event.target);
      if ((!isModalFormClickedOn || isCloseModalBtnClickedOn) && this.$modal.classList.contains("open-modal")) {
        this.editNote(this.selectedNoteId, {
          title: this.$modalTitle.value,
          text: this.$modalText.value,
        });
        this.$modal.classList.remove("open-modal");
      }
    }
  
    handleArchiving(event) {
      const $selectedNote = event.target.closest(".note");
      if ($selectedNote && event.target.closest(".archive")) {
        this.selectedNoteId = $selectedNote.id;
        this.deleteNote(this.selectedNoteId);
      } else {
        return;
      }
    }
  
    addNote({ title, text }) {
      if (text != "") {
        const newNote = new Note(cuid(), title, text);
        this.notes = [...this.notes, newNote];
        this.render();
      }
    }
  
    editNote(id, { title, text }) {
      this.notes = this.notes.map((note) => {
        if (note.id == id) {
          note.title = title;
          note.text = text;
        }
        return note;
      });
      this.render();
    }
  
    handleMouseOverNote(element) {
      const $note = document.querySelector("#" + element.id);
      const $checkNote = $note.querySelector(".check-circle");
      const $noteFooter = $note.querySelector(".note-footer");
      $checkNote.style.visibility = "visible";
      $noteFooter.style.visibility = "visible";
    }
  
    handleMouseOutNote(element) {
      const $note = document.querySelector("#" + element.id);
      const $checkNote = $note.querySelector(".check-circle");
      const $noteFooter = $note.querySelector(".note-footer");
      $checkNote.style.visibility = "hidden";
      $noteFooter.style.visibility = "hidden";
    }
  
    handleToggleSidebar() {
      if(this.miniSidebar) {
        this.$sidebar.style.width = "250px";
        this.$sidebar.classList.add("sidebar-hover");
        this.$sidebarActiveItem.classList.add("sidebar-active-item");
        this.miniSidebar = false;
      }
      else {
        this.$sidebar.style.width = "75px";
        this.$sidebar.classList.remove("sidebar-hover")
        this.$sidebarActiveItem.classList.remove("sidebar-active-item");
        this.miniSidebar = true;
      }
    }
  
  // onmouseover="app.handleMouseOverNote(this)" onmouseout="app.handleMouseOutNote(this)"
    saveNotes(){
      localStorage.setItem("notes", JSON.stringify(this.notes));
    }

    render(){
      this.saveNotes();
      this.displayNotes();
      if (this.viewMode === 'grid') {
        this.$notes.classList.remove('list-view');
        this.$notes.classList.add('grid-view');
      } else {
        this.$notes.classList.remove('grid-view');
        this.$notes.classList.add('list-view');
      }
    }
    displayNotes() {
      this.$notes.innerHTML = this.notes
        .map(
          (note) =>
            `
          <div class="note" id="${note.id}" >
            <span class="material-symbols-outlined check-circle"
              >check_circle</span
            >
            <div class="title">${note.title}</div>
            <div class="text">${note.text}</div>
            <div class="collaborators">
              ${note.collaborators
                .map(
                  (collaborator) =>
                    `<img src="${collaborator.avatar}" alt="Avatar" title="${collaborator.userId}" class="avatar" />`
                )
                .join("")}
            </div>
            <div class="note-footer">
              <div class="tooltip">
                <span class="material-symbols-outlined hover small-icon"
                  >add_alert</span
                >
                <span class="tooltip-text">Remind me</span>
              </div>
              <div class="tooltip">
                <span class="material-symbols-outlined hover small-icon"
                  >person_add</span
                >
                <span class="tooltip-text">Collaborator</span>
              </div>
              <div class="tooltip">
                <span class="material-symbols-outlined hover small-icon"
                  >palette</span
                >
                <span class="tooltip-text">Change Color</span>
              </div>
              <div class="tooltip">
                <span class="material-symbols-outlined hover small-icon"
                  >image</span
                >
                <span class="tooltip-text">Add Image</span>
              </div>
              <div class="tooltip archive">
                <span class="material-symbols-outlined hover small-icon"
                  >archive</span
                >
                <span class="tooltip-text">Archive</span>
              </div>
              <div class="tooltip">
                <span class="material-symbols-outlined hover small-icon"
                  >more_vert</span
                >
                <span class="tooltip-text">More</span>
              </div>
            </div>
          </div>
          `
        )
        .join("");
    }
    deleteNote(id) {
      this.notes = this.notes.filter((note) => note.id != id);
      this.render();
    }
  }
  
  const app = new App();