const themes = {
  general: {
    name: "🎉 General",
    themes: {
      basic: {
        name: "✨ Basic",
        accent: "#3f51b5",
        accent2: "#ffffff",
        font: "'Comic Neue', cursive",
        background: "assets/general/basic/backgrounds/",
        backgroundFolder: "assets/general/basic/backgrounds/",
        logo: "",
        overlaysFolder: "assets/general/basic/overlays/",
        templatesFolder: "assets/general/basic/templates/",
        welcome: {
          title: "Welcome!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      },
      birthday: {
        name: "🎂 Birthday",
        accent: "pink",
        accent2: "white",
        font: "'Comic Neue', cursive",
        background: "assets/general/birthday/backgrounds/",
        backgroundFolder: "assets/general/birthday/backgrounds/",
        logo: "",
        overlaysFolder: "assets/general/birthday/overlays/",
        templatesFolder: "assets/general/birthday/templates/",
        welcome: {
          title: "Happy Birthday!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      }
    }
  },
  school: {
    name: "🏫 School",
    themes: {
      hawks: {
        name: "🦅 Hawks",
        accent: "#041E42",
        accent2: "white",
        font: "'Comic Neue', cursive",
        background: "",
        logo: "",
        overlaysFolder: "assets/Hawks/overlays/",
        templatesFolder: "assets/Hawks/templates/",
        welcome: {
          title: "Go Hawks!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      },
      ane: {
        name: "🏫 ANE",
        accent: "#041E42",
        accent2: "#FFB81C",
        font: "'Comic Neue', cursive",
        backgroundFolder: "assets/school/ANE/backgrounds/",
        logo: "",
        overlaysFolder: "assets/school/ANE/overlays",
        templatesFolder: "assets/school/ANE/templates",
        welcome: {
          title: "ANE",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      }
    }
  },
  fall: {
    name: "🍂 Fall",
    holidays: {
      halloween: {
        name: "🎃 Halloween",
        accent: "orange",
        accent2: "white",
        font: "'Creepster', cursive",
        // Use folder-based background auto-detect (any background.* in this folder)
        backgroundFolder: "assets/holidays/fall/halloween/backgrounds/",
        overlaysFolder: "assets/holidays/fall/halloween/overlays/",
        logo: "",
        templatesFolder: "assets/holidays/fall/halloween/templates/",
        welcome: {
          title: "Happy Halloween!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      }
    }
  },
  winter: {
    name: "❄️ Winter",
    holidays: {
      christmas: {
        name: "🎄 Christmas",
        accent: "#c41e3a",
        accent2: "white",
        font: "'Comic Neue', cursive",
        background: "assets/holidays/winter/christmas/backgrounds/",
        logo: "",
        overlaysFolder: "assets/holidays/winter/christmas/overlays/",
        templatesFolder: "assets/holidays/winter/christmas/templates/",
        welcome: {
          title: "Merry Christmas!",
          portrait: "assets/holidays/winter/christmas/welcome/welcome-portrait.jpg",
          landscape: "assets/holidays/winter/christmas/welcome/welcome-landscape.jpg",
          prompt: "Touch to start the fun!"
        }
      },
      newyear: {
        name: "🎉 New Year",
        accent: "#FFD700",
        accent2: "white",
        font: "'Comic Neue', cursive",
        background: "assets/holidays/winter/newyear/backgrounds/fireworks-background.jpg",
        logo: "assets/holidays/winter/newyear/logo/newyear-logo.png",
        overlays: ["assets/holidays/winter/newyear/overlays/newyear-frame-1.png"],
        templates: [{ src: "assets/holidays/winter/newyear/templates/photostrip-1.png", layout: "double_column" }],
        welcome: {
          title: "Happy New Year!",
          portrait: "assets/holidays/winter/newyear/welcome/welcome-portrait.jpg",
          landscape: "assets/holidays/winter/newyear/welcome/welcome-landscape.jpg",
          prompt: "Start the countdown!"
        }
      },
      valentines: {
        name: "💕 Valentine's Day",
        accent: "#ff5e91",
        accent2: "white",
        font: "'Comic Neue', cursive",
        backgroundFolder: "assets/holidays/winter/Valentines/backgrounds/",
        templatesFolder: "assets/holidays/winter/Valentines/templates/",
        welcome: {
          title: "Happy Valentine's Day!",
          portrait: "",
          landscape: "",
          prompt: "Touch to start"
        }
      }
    }
  }
};

themes.spring = {
  name: "🌸 Spring",
  holidays: {
    stpatricksday: {
      name: "🍀 St. Patrick's Day",
      accent: "#0f6d2f",
      accent2: "white",
      font: "'Comic Neue', cursive",
      backgroundFolder: "assets/holidays/spring/st.patricksday/backgrounds/",
      overlaysFolder: "assets/holidays/spring/st.patricksday/overlays/",
      templatesFolder: "assets/holidays/spring/st.patricksday/templates/",
      welcome: {
        title: "Happy St. Patrick's Day!",
        portrait: "",
        landscape: "",
        prompt: "Touch to start"
      }
    }
  }
};

export default themes;
