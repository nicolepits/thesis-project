This app was created for my bachelor diploma thesis and contains algorithms/data researched by Harokopio University's Nutrition and Dietetics department.

<h1>Web-based type 2 diabetes risk assessment and personalised recommendation tool</h1>
A web application that estimates diabetes type 2 risk, and provides personalised meal plans and physical activity duration for weight loss.

**MongoDB database exports:**
diabetes_thesis/mongo_exports

**Structure**
- myapp.js : main code
- /models/user.js : mongo models
- /views : contains .ejs templates (html pages)
- /static : contains all static content such as css, js, icons, fonts etc

**Run app**
1. Install npm modules
2. $systemctl start mongod.service
2. Run make file using command : $ make
3. URL: localhost:3000/

**Run Docker**
- $sudo docker build . -t thesis/node-web-app
- $sudo docker-compose up

Stop docker-compose: $sudo docker-compose down

**When JSON export files are updated, It is important to delete the 'data' directory of the source directory before rebuilding docker**

**Clear unused docker image data**: $sudo docker system prune

**Sources**
<a href="https://github.com/HarshvardhanThosar/ChatBot-UI">Chatbot Base UI<a>


