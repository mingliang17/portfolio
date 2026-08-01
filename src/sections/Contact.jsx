import React, { useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { assetPath } from '../utils/assetPath.js'; 

const Contact = () => {
    const formRef = useRef();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        name: '',
        email: '',
        message: '',
    });

    const handleChange = ({ target: { name, value } }) => {
        setForm({ ...form, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await emailjs.send(
                'service_tqozss9', 
                'template_lfo2ewt', 
                {
                    from_name: form.name,
                    from_email: form.email,
                    to_name: 'MingLiang',
                    to_email: 'mingliangng.nml@gmail.com',
                    message: form.message,
                },
                'apjZtsCMlstGIwv9c'
            );

            setLoading(false);
            alert('Your message is sent');
            setForm({ name: '', email: '', message: '' });
        } catch (error) {
            setLoading(false);
            console.error(error);
            alert('Something went wrong');
        }
    };

    return (
        <section className="c-space my-20">
            <div className="relative min-h-screen flex items-center justify-center flex-col">
                <img src={assetPath('assets/terminal.png')} alt="terminal background" className="absolute inset-0 min-h-screen" />
                <div className="contact-container">
                    <h3 className="head-text">Get in Touch</h3>
                    <p className="text-lg text-white-600 mt-3">I'm here to help elevate your project to the next level</p>

                    <form ref={formRef} onSubmit={handleSubmit} className="mt-12 flex flex-col space-y-7">
                        <label className="space-y-3">
                            <span className="field-label">Your Full Name</span>
                            <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="What's your good name?" className="field-input" />
                        </label>
                        <label className="space-y-3">
                            <span className="field-label">Your Email Address</span>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="What's your email address?" className="field-input" />
                        </label>
                        <label className="space-y-3">
                            <span className="field-label">Your Message</span>
                            <textarea name="message" value={form.message} onChange={handleChange} required rows={5} placeholder="What's your message?" className="field-input" />
                        </label>
                        <button className="field-btn" type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Message'}
                            <img src={assetPath('assets/arrow-up.png')} alt="arrow-up" />
                        </button>
                    </form>
                </div>  
            </div>
        </section>
    );
};

export default Contact;
