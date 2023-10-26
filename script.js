const firebaseConfig = {
  apiKey: "AIzaSyCYgfJlrkt-04--f1mUoLOM52cmV6_bRME",
  authDomain: "quiz-cacda.firebaseapp.com",
  projectId: "quiz-cacda",
  storageBucket: "quiz-cacda.appspot.com",
  messagingSenderId: "800720927295",
  appId: "1:800720927295:web:20a8f9610fd5c465cf168a"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("startButton");
  const nextButton = document.getElementById("nextButton");

  let questionIndex = 0;
  let score = 0;
  let correctResponses = [];

  async function getQuestionsApi() {
    try {
      let response = await fetch(
        "https://opentdb.com/api.php?amount=10&type=multiple"
      );
      let data = await response.json();
      let objQuestions = data.results;

      let getInfo = objQuestions.map((question) => ({
        question: question.question,
        correctAnswer: question.correct_answer,
        incorrectAnswers: question.incorrect_answers,
      }));

      localStorage.setItem("questionsData", JSON.stringify(getInfo));
      showQuestion(getInfo, questionIndex);
    } catch (error) {
      console.log(`Hubo un error: ${error}`);
    }
  }

  startButton.addEventListener("click", function () {
    getQuestionsApi();
    startButton.style.display = "none";
    const welcomeContainer = document.querySelector("#welcomeContainer");
    welcomeContainer.style.display = "none";
    const questionContainer = document.querySelector("#playQuiz");
    questionContainer.style.display = "block";

    nextButton.style.display = "block";
  });

  function getDataFromFirestore() {
    const datos = [];
  
    db.collection("quiz")
      .orderBy("result", "desc")
      .get()
      .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          datos.push({
            user: data.user,
            result: data.result,
          });
        });
        return datos;
      })
      .catch((error) => {
        console.log("Error al obtener los datos de Firestore: ", error);
      });
  }
  function pintarRanking() {
    const datos = getDataFromFirestore();
    datos.map((data) => data.user)
    datos.map((data) => data.result)
  }

  function processUserDataAndShowChart() {
    const datos = getDataFromFirestore();
  
    const data = {
      labels: [datos.map((data) => data.user)],
      series: [datos.map((data) => data.result)]
    };
  
    const options = {
      high: 10,
      low: 0,
      width: "50%",
      height: "150px"
    };
  
    new Chartist.Bar("#chart2", data, options);
  }

  nextButton.addEventListener("click", async function () {
    const typeAnswer = document.querySelectorAll('input[type="radio"]:checked');

    if (typeAnswer.length === 1) {
      const selectedInput = typeAnswer[0];
      const answer = selectedInput.value;

      const currentQuestion = getQuestionsFromLocalStorage()[questionIndex];
      const totalQuestions = getQuestionsFromLocalStorage().length;

      if (answer === currentQuestion.correctAnswer) {
        selectedInput.parentNode.classList.add("correct");
        score += 1;
        correctResponses.push(answer);
      } else {
        selectedInput.parentNode.classList.add("incorrect");
      }

      questionIndex++;

      if (questionIndex < totalQuestions) {
        showQuestion(getQuestionsFromLocalStorage(), questionIndex);
      } else {
        const section = document.getElementById("question_quiz");
        section.innerHTML = "¡HAS TERMINADO LAS PREGUNTAS DE QUIZZYWIZ!";
        nextButton.style.display = "none";

        const percentage = (score / totalQuestions) * 100;
        const section1 = document.getElementById("results");
        section1.innerHTML = `Has acertado el ${percentage}% de las preguntas`;

        const user = firebase.auth().currentUser;

        const game = {
          user: user.l,
          date: new Date(),
          result: correctResponses.length,
        };
        await saveResults(game);
        
        processUserDataAndShowChart();
        pintarRanking();
      }
    } else {
      alert("Tienes que elegir alguna respuesta");
    }
  });

  function showQuestion(questions, index) {
    let section = document.getElementById("question_quiz");
    let question = questions[index];
    // Respuestas orden aleatorio
    let mixedAnswers = [question.correctAnswer, ...question.incorrectAnswers];
    mixedAnswers.sort(() => Math.random() - 0.5);

    let arrTemplateString = `
                <h3 class="pregunta">${question.question}</h3>
                <label><input type="radio" value="${mixedAnswers[0]}" name="res" required>${mixedAnswers[0]}</label>
                <label><input type="radio" value="${mixedAnswers[1]}" name="res" required>${mixedAnswers[1]}</label>
                <label><input type="radio" value="${mixedAnswers[2]}" name="res" required>${mixedAnswers[2]}</label>
                <label><input type="radio" value="${mixedAnswers[3]}" name="res" required>${mixedAnswers[3]}</label>
            `;
    section.innerHTML = arrTemplateString;
  }

  function getQuestionsFromLocalStorage() {
    let questionsData = localStorage.getItem("questionsData");
    if (questionsData) {
      return JSON.parse(questionsData);
    }
    return null;
  }

  // MIRAR AUTH

  const saveResults = async (result) => {
    console.log("Valores que se van a guardar en Firestore:", result);
    await db
      .collection("quiz")
      .add(result)
      .then((docRef) => console.log("Document written with ID: ", docRef.id))
      .catch((error) => console.error("Error adding document: ", error));
  };
});

const createUser = (user) => {
  db.collection("quiz")
    .add(user)
    .then((docRef) => console.log("Document written with ID: ", docRef.id))
    .catch((error) => console.error("Error adding document: ", error));
};

const readAllUsers = (born) => {
  db.collection("quiz")
    .where("first", "==", born)
    .get(user)
    .then((querySnapshot) => {
      querySnapshot.forEach((user) => {
        console.log(user.data());
      });
    });
};

const signUpUser = (email, password) => {
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      let user = userCredential.user;
      alert(`Se ha registrado ${user.email} en el sistema`);
      createUser(game);
    })
    .catch((error) => {
      console.log("Error en el sistema" + error.message);
    });
};

const signInUser = (email, password) => {
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      let user = userCredential.user;
      alert(`Se ha logueado correctamente ${user.email}`);
      console.log("USER", user);
      window.location.href = "./quiz.html";
    })
    .catch((error) => {
      let errorCode = error.code;
      let errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
      alert(`Error en usuario o contraseña`);
    });
};

document.getElementById("form2").addEventListener("submit", function (event) {
  event.preventDefault();
  let email = event.target.elements.email2.value;
  let pass = event.target.elements.pass3.value;
  signInUser(email, pass);
});

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    console.log(`Está en el sistema:${user.email} ${user.uid}`);
  } else {
    console.log("No hay usuarios en el sistema");
  }
});

document.getElementById("form1").addEventListener("click", function (event) {
  event.preventDefault();

  if (
    /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/.test(
      event.target.elements.email.value
    )
  ) {
    var email = event.target.elements.email.value;
  } else {
    alert("Pruebe con otra dirección email,formato no válido");
  }

  if (/^(?=.*[A-Z])(?=.*\d).{6,}$/.test(event.target.elements.pass.value)) {
    var pass = event.target.elements.pass.value;
  } else {
    alert(
      "La contraseña debe cumplir con los siguientes requisitos:\n" +
        "- Al menos una letra mayúscula\n" +
        "- Al menos un número\n" +
        "- Longitud mínima de 6 caracteres"
    );
  }

  if (/^\d.*(?=.{6,})/.test(event.target.elements.pass2.value)) {
    var pass2 = event.target.elements.pass2.value;
  } else {
    alert("Contraseña incorrecta");
  }

  if (pass === pass2) {
    signUpUser(email, pass);
  } else {
    alert("Las contraseñas no coinciden");
  }
});

const signOut = () => {
  let user = firebase.auth().currentUser;

  firebase
    .auth()
    .signOut()
    .then(() => {
      console.log("Sale del sistema: " + user.email);
    })
    .catch((error) => {
      console.log("Hubo un error: " + error);
    });
};

document.getElementById("form2").addEventListener("submit", function (event) {
  event.preventDefault();
  let email = event.target.elements.email2.value;
  let pass = event.target.elements.pass3.value;
  signInUser(email, pass);
});


