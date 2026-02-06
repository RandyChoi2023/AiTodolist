
import { WelcomeUser } from "react-email-starter/emails/welcome-page";
import { Resend } from "resend";


const client = new Resend(process.env.RESEND_API_KEY);
                          
export const loader = async () => {
    
    const { data, error } = await client.emails.send({
        from: 'Randy <randy@mail.justdoai.it.com>',
        to: 'enjoyg@naver.com',
        subject: 'Welcome to the ai to do list',
        react: <WelcomeUser username={'randy'}></WelcomeUser>,
    });

    return Response.json({data, error});
}
