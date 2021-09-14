// Selecting element to view chat
var chatBotSession              = document.querySelector( ".chatBot .chatBody .chatSession" )

// Selecting trigger elements of conversation
var chatBotSendButton           = document.querySelector( ".chatBot .chatForm #sendButton" )
var chatBotTextArea             = document.querySelector( ".chatBot .chatForm #chatTextBox" )

// Default values for replies
var chatBotInitiateMessage      = "Hello! How can I help you today?<br>Enter /hint for my services!"
var chatBotBlankMessageReply    = "Type something!"
var chatBotReply                = "{{ reply }}"

// Collecting user input
var inputMessage                = ""

// This helps generate text containers in the chat
var typeOfContainer             = ""

//Flags
var flag = new Boolean();
var wFlag = new Boolean();
var hFlag = new Boolean();
var eFlag = new Boolean();

//Trackers
var bmiStep;

//Measurements
let height;
let weight;
let classif;
let ethnicity = new Boolean();;

//readFile function
function readFile(file,region){
    let array = new Array();
    var f =  new XMLHttpRequest();
    f.open("GET",file, true);
    f.onreadystatechange = function () {
        if(f.readyState == 4){
            if(f.status == 200 || f.status == 0){
                var res = f.responseText;
                var data = JSON.parse(res);
                //let array = new Array();
                //alert(JSON.stringify(experts));
                //console.log(data['experts'])
                data['experts'].forEach(function (item) {
                    //console.log(item);
                    if(item['region'] === region){
                        array.push(item);
                    }
                });
                //console.log(array);
            }
        }
    }
    f.send(null);
    return array;
}
function getHTML(url,region) {
    let array = new Array();
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', url, true);
        xhr.onload = function () {
            var status = xhr.status;
            if (status == 200) {
                var data = JSON.parse(xhr.response);
                //let array = new Array();
                //alert(JSON.stringify(experts));
                //console.log(data['experts'])
                data['experts'].forEach(function (item) {
                    //console.log(item);
                    if(item['region'] === region){
                        array.push(item);
                    }
                });
                resolve(array);
            } else {
                reject(status);
            }
        };
        xhr.send();
    });
}

// Function to open ChatBot
chatBotSendButton.addEventListener("click", (event)=> {
    // Since the button is a submit button, the form gets submittd and the complete webpage reloads. This prevents the page from reloading. We would submit the message later manually
    event.preventDefault()
    if( validateMessage() ){
        inputMessage    = chatBotTextArea.value
        typeOfContainer = "message"
        createContainer( typeOfContainer )
        setTimeout(function(){
            typeOfContainer = "reply"
            createContainer( typeOfContainer )
        }, 750);
    }
    else{        
        typeOfContainer = "error";
        createContainer( typeOfContainer )
    }
    chatBotTextArea.value = ""
    chatBotTextArea.focus()
})

async function createContainer( typeOfContainer ) {
    var containerID = ""
    var textClass   = ""
    switch( typeOfContainer ) {
        case "message"      :
            // This would create a message container for user's message
            containerID = "messageContainer"
            textClass   = "message"
            break;
        case "reply"        :
        case "initialize"   :
        case "error"        :
            // This would create a reply container for bot's reply
            containerID = "replyContainer"
            textClass   = "reply"
            break;
        default :
            alert("Error! Please reload the webiste.")
    }

    // Creating container
    var newContainer = document.createElement( "div" )
    newContainer.setAttribute( "class" , "container" )
    if( containerID == "messageContainer" )
        newContainer.setAttribute( "id" , "messageContainer" )
    if( containerID == "replyContainer" )
        newContainer.setAttribute( "id" , "replyContainer" )
    chatBotSession.appendChild( newContainer )

    switch( textClass ) {
        case "message"  :
            var allMessageContainers    = document.querySelectorAll("#messageContainer")
            var lastMessageContainer    = allMessageContainers[ allMessageContainers.length - 1 ]
            var newMessage              = document.createElement( "p" )
            newMessage.setAttribute( "class" , "message animateChat" )
            newMessage.innerHTML        = inputMessage
            lastMessageContainer.appendChild( newMessage )
            lastMessageContainer.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
            break
        case "reply"    :
            var allReplyContainers      = document.querySelectorAll( "#replyContainer" )    
            var lastReplyContainer      = allReplyContainers[ allReplyContainers.length - 1 ]
            var nextReplyContainer = allReplyContainers[ allReplyContainers.length - 1 ]
            var newReply                = document.createElement( "p" )
            //create option list for available regions
            var newSelectReply        = document.createElement("select");
            newSelectReply.id = "list";
            var option1 = document.createElement("option");
            option1.text = 'Pagrati'
            option1.value = 'Pagrati'
            var option2 = document.createElement("option");
            option2.text = 'Nea Smirni'
            option2.value = 'Nea Smirni'
            var option3 = document.createElement("option");
            option3.text = 'Ampelokipoi'
            option3.value = 'Ampelokipoi'
            newSelectReply.appendChild(option1);
            newSelectReply.appendChild(option2);
            newSelectReply.appendChild(option3);

            newReply.setAttribute( "class" , "reply animateChat accentColor" )
            switch( typeOfContainer ){
                case "reply"        :
                    if( inputMessage.includes("specialist")){
                      newReply.innerHTML  = "Choose your region. Type 'okay' when done!";
                      lastReplyContainer.appendChild( newReply )
                      //create a new container for select element
                      var selectContainer = document.createElement( "div" )
                      selectContainer.setAttribute( "class" , "container" )
                      selectContainer.setAttribute( "id" , "replyContainer" )
                      chatBotSession.appendChild( selectContainer )

                      selectContainer.appendChild(newSelectReply)
                      flag = new Boolean(true);
                    } else if( inputMessage.toLowerCase() == "no" || inputMessage.toLowerCase().includes("bye") || inputMessage.toLowerCase().includes("goodbye")){
                      newReply.innerHTML = "Understood. Goodbye!"
                      lastReplyContainer.appendChild( newReply )
                    } else if( (inputMessage == "Okay" || inputMessage == "okay") && flag == true) {
                      newReply.innerHTML = "Here are a few dietologists available in your area:"
                      lastReplyContainer.appendChild( newReply )
                      let region = document.getElementById("list").value;
                      let experts = await getHTML('js/experts.json',region);
                      //alert(experts);
                      console.dir(experts);

                      //create a new container for list of experts
                      var newList = document.createElement( "div" )
                      newList.setAttribute( "class" , "container" )
                      newList.setAttribute( "id" , "replyContainer" )
                      chatBotSession.appendChild( newList )

                      let newOption = document.createElement("p"); 
                      newOption.setAttribute("class", "reply animateChat accentColor");
                      let html = '';
                      let i = 1;
                      for(let item of experts){
                        console.log("yes");
                        if(i==1){
                          html = "<ul>"
                        }
                        html = html + "<li>"+item['name']+"</li><li>Tel:"+item['phone_number']+"</li><li>Address:"+item['address']+"</li><br>"
                        console.dir(html);
                        if(i == experts.length){
                          html = html + "</ul>"
                        }
                        i++;

                      }
                      console.dir(html);
                      newOption.innerHTML = html;
                      newList.appendChild(newOption);
                      flag = new Boolean(false);
                    } else if(inputMessage.toLowerCase().includes("tell me a joke")){
                        newReply.innerHTML = "Why did the programmer quit his job? <br> Because he didn't get arrays &#128526;" ;
                        lastReplyContainer.appendChild(newReply)
                    } else if(inputMessage.includes("/hint") || inputMessage.includes("hint")){
                        newReply.innerHTML = "You can ask me: <br><ul><li>&#10004;Find me a specialist</li><li>&#10004;Find my BMI</li><li>&#10004;Tell me a joke</li><li>&#10004;How are you?</li></ul>" ;
                        lastReplyContainer.appendChild(newReply)
                    } else if(inputMessage.includes("how are you") || inputMessage.includes("How are you")){
                        newReply.innerHTML = "I am doing good! How about you?" ;
                        lastReplyContainer.appendChild(newReply)
                    } else if(inputMessage.includes("bmi") || inputMessage.includes("BMI")){
                        newReply.innerHTML = "Alright. What is your height in centemeters?" ;
                        bmiStep = 1;
                        //hFlag = new Boolean(true);
                        lastReplyContainer.appendChild(newReply)
                    } else if( bmiStep == 1 && !isNaN(inputMessage) ){
                      height = parseInt(inputMessage) / 100;
                      newReply.innerHTML = "What is your weight in kilograms?";
                      //hFlag = new Boolean(false);
                      //wFlag = new Boolean(true);
                      bmiStep++;
                      lastReplyContainer.appendChild(newReply);
                    } else if( bmiStep == 2 && !isNaN(inputMessage) ){
                      newReply.innerHTML = "Are you Asian or non-Asian?";
                      weight = parseInt(inputMessage); //convert string to int
                      //wFlag = new Boolean(false);
                      //eFlag = new Boolean(true);
                      bmiStep++;
                    } else if( bmiStep == 3 && (inputMessage.toLowerCase().includes("non","asian") || inputMessage.toLowerCase() == "asian")){
                      if(inputMessage.toLowerCase().includes("non asian")){
                        ethnicity = new Boolean(true);
                      } else {
                        ethnicity = new Boolean(false);
                      }
                      let bmi = (weight / (height * height)).toFixed(2);
                      if( ethnicity == true ){ //non asian
                        if( bmi<18.5) {
                          classif = "underweight";
                        } else if( bmi>=18.5 && bmi<=24.9 ){
                          classif = "normal weight";
                        } else if( bmi>= 25.0 && bmi <=29.9 ){
                          classif = "overweight";
                        } else if( bmi>= 30.0 && bmi <=34.9 ){
                          classif = "obese (class I)"
                        } else if( bmi>= 35.0 && bmi <=39,9 ){
                          classif = "obese (class II)";
                        } else if( bmi>= 40.0){
                          classif = "obese (class III)";
                        } else {
                          newReply.innerHTML = "Something went wrong! Are you sure you gave me valid measurements?";
                          lastReplyContainer.appendChild(newReply);
                          break;
                        }
                      } else { //asian
                        if( bmi<18.5) {
                          classif = "underweight";
                        } else if( bmi>=18.5 && bmi<=22.9 ){
                          classif = "normal weight";
                        } else if( bmi>= 23.0 && bmi <=24.9 ){
                          classif = "overweight";
                        } else if( bmi>= 25.00 && bmi <=29.9 ){
                          classif = "obese (class I)"
                        } else if( bmi>=30.0 ){
                          classif = "obese (class II)";
                        } else {
                          newReply.innerHTML = "Something went wrong! Are you sure you gave me valid measurements?";
                          lastReplyContainer.appendChild(newReply);
                          break;
                        }
                      }
                      newReply.innerHTML = "Your BMI is "+bmi+" and your classification is "+classif+".";
                      lastReplyContainer.appendChild(newReply);
                      //wFlag = new Boolean(false);
                    } else {
                      console.log(flag);
                      newReply.innerHTML = "I am sorry, I cannot understand you. Try something else maybe?"
                      lastReplyContainer.appendChild( newReply )
                    }
                    break
                case "initialize"   :
                    newReply.innerHTML  = chatBotInitiateMessage
                    break
                case "error"        :
                    newReply.innerHTML  = chatBotBlankMessageReply
                    break
                default             :
                    newReply.innerHTML  = "Sorry! I could not understannd."
            }
            setTimeout(function (){
                lastReplyContainer.appendChild( newReply )
                lastReplyContainer.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
            }, 10)            
            break
        default         :
            console.log("Error in conversation")
    }
}

function initiateConversation() {
    chatBotSession.innerHTML = ""
    typeOfContainer = "initialize"
    createContainer( typeOfContainer )
}
