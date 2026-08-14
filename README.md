Lucy -Ai voice Companion 

Lucy is a voice-first AI companion built to make interaction with an AI feel more natural than a traditional text chatbot.
Instead of typing every request ,user can simply speak to lucy .She listens to the user's voice ,understands the request ,generates an AI response ,speaks the response back ,and can perform useful actions such as YouTube control ,image search ,googlr search ,social-media  handles ,list generation and everyday conversational tasks.
The main idea behind it was;- Talk to the assistant naturally ,instead of interacting with it like a text box.

what lucy can do

lucy is combo of ai with voice based interaction and practical commands
-voice based conversation
-natural lang command understanding
-ai-generated response using groq
browser speech recogmnition
voice responses using speech synthesis
conversational memory
youtube search ,pause and playback
google search
image search
result in form of lists 
instagram and facebook navigation
weather ,date ,day and time requests
calculator access
personalized assistant name 
assistant image custom
user auth
login and sign up
logout 
mongoDb databse integration
cloudinary image upload 
react based frontend 
express.js backend 



TECH STACK
~Frontend:-
~React
~Vite 
~React router
~Axios
~Tailwind CSS
~React Icons
~Browser Speech Recognition Api
~Browser Speech Synthesis Api

Backend :-
~Node.js
~Express.js
~MongoDB
~Mongoose
~Axios
~Cookie Parser
~Cors
~Json Web Token authentication
~bcryptjs
~Multer
~Cloudinary

AI and API's

~Groq api
~Browser speech recog
~Browser Speech recog
~youtube
~Image search API (serper api)

project structure

LUCY
|
|-frontend/
| |-src/--->assets
| |     |---->components
| |     |---->context
| |     |----->pages    
| |     |----->App.jsx
| |     |----->main.jsx
| |
| |-----public/
| |-----package.json
| |-----vite.config.js
|
|--backend
|   |--config
|   |--controllers
|   |--middleware
|   |--models
|   |--routes
|   |--utils
|   |--server.js
|   |-package.json
|   |.env
|   
|--Readme.md

REQUIREMENTS

before running it make sure to inistall
-Node.js
-npm
-MongoDb database
-git

you also need api credentials for the external services used by the backend .
-->Node.js 18+

Installations
1) clone the project 

---git clone <YOUR_GITHUB_REPOSITORY_URL>

move to project directory
1) cd Lucy


BACKEND SETUP
1) open a terminal and move into the backend directory
2)  cd backend 

then install dependencies
3)  npm install

4) create .env file inside backend directory
backend/
|
|---.env

add these varibales 
{
PORT=8000

MONGODB_URL=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GROQ_API_KEY=your_groq_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
}

do not commit then i commited by mistake

add it to .gitignore file
.env
node_modules 

Frontend setup
cd frontend

Install the dependencies 
npm install

in url or backend put for local development 
http://localhost:8000

and for deployed version
https://lucy-backend-qirz.onrender.com

Running project

Start the backend 
npm run dev

it should start on 
http://localhost:8000

you will see :-Server running on port 8000

Start the Frontend 
open another terminal and move into the fontend directory
cd frontend 

then start Vite servor 
npm run dev

cisite this local url similar to :-http://localhost:5173


TRY LUCY YOURSELF

!)basic conversation 
try 
"hey lucy ,how are you?"
"explain what is aritificial intelligence is."
"What is the difference between JavaScript and Python?"
Lucy should respond conversationally using I model

MEMORY TEST
try 
"tell me about Python"
then 
"what is it used for "
then 
"give me some examples"
then
"what are its advantages"

3)Intent  understandoing

try 
"search google for react"
"show me the pics of solar system "
'play some relaxing music"
"what time is it ?"
"open instagram "
"open facebook"


YOUTUBE CONTROLS
lucy can interact with youtube with voice controls
PLAY
try
"play some music"
or
"play imagine Dragons"

SEEARCH
try
"search youtube js tutorials"

PAUSE
while video play
"pause youtube "

RESUME
"resume youtube"

CLOSE
"close youtube"


IMAGE SEARCH
try 
"show me the images of solar system "
or
"find the pictures of mountains"

GOOGLE SEARCH
try 
"search google for react "
"search google for ai"

STRUCTURED LISTS
lucy will give a list when asked
try
"give me the top 5 programming languages"
or
"give me 5 best js frameworks"

YOU CAN ALSO INTERACT WITH THE LIST 
try
"search no 2"


EVERYDAY INFORAMATION
try 
"What time is it?"
"What's today's date?"
"What day is today?"

Future Scope 
-1_)Human like emotion understanding via web cam facial recognition
-2_)Real-time 2d AI avtar that reacts with conversation
-3_)windows overlay or as an extension
-4_)more natural human like voice interactions \
-5_)advance context awareness or user queries














