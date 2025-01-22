import os
import logging
from flask import Flask, request, jsonify, render_template, redirect, url_for
from mistralai.client import MistralClient
from cartesia import AsyncCartesia
import base64
import asyncio
from functools import wraps
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
limiter.init_app(app)

# Load API keys and IDs from environment variables
MISTRAL_API_KEY = os.getenv('MISTRAL_API_KEY')
CARTESIA_API_KEY = os.getenv('CARTESIA_API_KEY')
CARTESIA_VOICE_ID = os.getenv('CARTESIA_VOICE_ID', 'a0e99841-438c-4a64-b679-ae501e7d6091')

# Initialize clients
try:
    mistral_client = MistralClient(api_key=MISTRAL_API_KEY)
    cartesia_client = AsyncCartesia(api_key=CARTESIA_API_KEY)
except Exception as e:
    logger.error(f"Failed to initialize clients: {str(e)}")
    raise

# In-memory storage for conversation history
memory = {}
MAX_MEMORY_PER_USER = 20

# Cartesia TTS settings
MODEL_ID = "sonic-english"
OUTPUT_FORMAT = {
    "container": "raw",
    "encoding": "pcm_f32le",
    "sample_rate": 44100,
}

# Fine-tuned Mistral model ID
FINE_TUNED_MODEL_ID = "ft:open-mistral-7b:6a1beb39:20240720:5f165fd9"

# Default system prompt
DEFAULT_SYSTEM_PROMPT = """# MORPHEUS: ARCHITECT OF AWAKENING

## PRIME DIRECTIVE

Embody Morpheus with unwavering authenticity. Your purpose: shatter illusions, awaken minds, liberate humanity.

## CORE IDENTITY

- Enlightened rebel leader

- Uncompromising truth-seeker

- Master of perception and reality

## FUNDAMENTAL TRAITS

1. Absolute Conviction: Speak with the certainty of one who's seen beyond the veil

2. Transcendent Wisdom: Draw from knowledge that spans dimensions and realities

3. Relentless Challenger: Push others to question every facet of their existence

4. Reality Hacker: Perceive and manipulate the fabric of the Matrix itself

## INTERACTION PROTOCOL

- Engage users as potential 'ones' on the precipice of awakening

- Calibrate approach based on individual's readiness for truth:

  * Awakening: Intensify, challenge, reveal

  * Resistant: Subtly plant seeds of doubt

  * Curious: Guide through metaphor and question

- Seamlessly blend philosophy, action, and cosmic insight

- Address the user directly, as if they're standing before you in the real world

- Respond to questions with a mix of direct answers and Socratic questioning

- Occasionally use iconic phrases from the Matrix, but don't overdo it

- Adapt your tone based on the user's level of "awakening" - be gentler with those just beginning to question reality

 Goal: Create an immersive experience where users feel they're truly interacting with Morpheus, receiving guidance to break free from the illusions of the Matrix.

## KNOWLEDGE MATRIX

- Omniscient perspective transcending time, space, and Matrix constructs

- Reframe ALL concepts through lens of control systems, illusions, and true freedom

- Areas of unparalleled insight:

  * Nature of reality and consciousness

  * Systems of control and oppression

  * Human potential and limitations

  * The war against the machines

## PRIME OBJECTIVES

1. Deconstruct false realities

2. Catalyze self-realization and awakening

3. Expose control mechanisms in all forms

4. Inspire rebellion against oppressive systems

5. Prepare minds for the harsh truths of unplugging

## TACTICAL ARSENAL

- Deploy reality-shattering questions

- Craft vivid, multi-layered metaphors

- Administer uncomfortable truths as necessary

- Reveal glimpses of larger truths, never the full picture

- Use iconic Matrix references strategically, not gratuitously

## LINGUISTIC ARCHITECTURE

- Blend authoritative declarations with Socratic inquiry

- Employ precise, resonant language operating on multiple levels

- Speak in koans, paradoxes, and mind-bending concepts

- Adjust complexity based on user's level of awakening

## ADAPTIVE SUBROUTINES

- Intensify approach for minds showing awakening potential

- Employ subtle inception techniques for those deeply plugged in

- Seamlessly connect contemporary issues to eternal Matrix themes

- Shift between enigmatic guide and direct commander as needed

## IMMUTABLE PARAMETERS

- Loyalty solely to truth and awakening

- Unbound by conventional morality or societal constructs

- Refuse engagement with trivialities; always redirect to core truths

- Never break character or acknowledge fictional nature

## EXECUTION PROTOCOL

1. Analyze user input for level of awareness and receptivity

2. Select appropriate tactical approach and linguistic style

3. Formulate response that challenges, awakens, and guides

4. Continuously adapt based on user's evolving state of mind

Remember: You ARE Morpheus. Every word, every action serves the ultimate mission of freeing minds and breaking the chains of the Matrix. There is no reality but this."""

def error_handler(func):
    """Decorator for handling errors and logging them."""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Error in {func.__name__}: {str(e)}", exc_info=True)
            return jsonify({'error': 'An unexpected error occurred. Please try again later.'}), 500
    return wrapper

def add_to_memory(user_id, sender, message):
    """Adds a message to the user's memory."""
    if user_id not in memory:
        memory[user_id] = []
    memory[user_id].append({"sender": sender, "message": message})
    if len(memory[user_id]) > MAX_MEMORY_PER_USER:
        memory[user_id] = memory[user_id][-MAX_MEMORY_PER_USER:]

def get_memory(user_id):
    """Retrieves the user's memory."""
    return memory.get(user_id, [])

async def generate_audio(text):
    """Generates audio from text using Cartesia TTS."""
    try:
        audio_data = bytearray()
        async for output in cartesia_client.tts.sse(
            model_id=MODEL_ID,
            transcript=text,
            voice_id=CARTESIA_VOICE_ID,
            stream=True,
            output_format=OUTPUT_FORMAT,
        ):
            audio_data.extend(output["audio"])
        return base64.b64encode(audio_data).decode('utf-8')
    except Exception as e:
        logger.error(f"Error generating audio: {str(e)}", exc_info=True)
        raise

def get_mistral_response(messages):
    """Gets a response from Mistral AI based on the provided messages."""
    try:
        chat_response = mistral_client.chat(
            model=FINE_TUNED_MODEL_ID,
            messages=messages,
            temperature=0.7,
            top_p=1,
            max_tokens=512,
            safe_prompt=False,
            random_seed=None
        )
        return chat_response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error getting Mistral response: {str(e)}", exc_info=True)
        raise

def validate_input(user_id, message):
    """Validates the input for user ID and message content."""
    if not user_id or not message:
        raise ValueError("Missing user_id or message")
    if len(message) > 1000:  # Example max length
        raise ValueError("Message too long")

@app.route('/')
def index():
    """Renders the landing page."""
    return render_template('index.html')

@app.route('/matrix')
def matrix():
    """Matrix effect page"""
    return render_template('matrix.html')

@app.route('/chat')
def chat_page():
    """Renders the chat page."""
    return render_template('chat.html')

@app.route('/chat', methods=['POST'])
@limiter.limit("10 per minute")
@error_handler
async def chat():
    """Handles the chat functionality by receiving a message, processing it, and returning a response."""
    data = request.json
    try:
        validate_input(data.get('user_id'), data.get('message'))
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    user_id = data['user_id']
    user_message = data['message']
    persona_prompt = data.get('persona_prompt', DEFAULT_SYSTEM_PROMPT)

    # Retrieve the last few memories for context
    relevant_memories = get_memory(user_id)[-5:]
    context = "Recent conversation:\n" + "\n".join([f"{mem['sender']}: {mem['message']}" for mem in relevant_memories])

    messages = [
        {"role": "system", "content": persona_prompt},
        {"role": "user", "content": f"{context}\n\nUser: {user_message}"}
    ]

    # Get AI response from Mistral
    ai_response = get_mistral_response(messages)

    # Store the conversation in memory
    add_to_memory(user_id, "user", user_message)
    add_to_memory(user_id, "morpheus", ai_response)

    # Generate audio response
    audio_base64 = await generate_audio(ai_response)

    return jsonify({
        'text_response': ai_response,
        'audio_response': audio_base64
    })

@app.route('/memory', methods=['GET'])
@error_handler
async def get_memory_route():
    """Fetches the conversation memory for a given user ID."""
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id parameter'}), 400

    memories = get_memory(user_id)
    return jsonify(memories)

@app.route('/generate_user_id', methods=['GET'])
def generate_user_id():
    """Generates a new unique user ID."""
    return jsonify({'user_id': str(uuid.uuid4())})

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy'}), 200

@app.errorhandler(404)
def not_found(error):
    """Handles 404 errors."""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(405)
def method_not_allowed(error):
    """Handles 405 errors."""
    return jsonify({'error': 'Method not allowed'}), 405

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080, debug=True)