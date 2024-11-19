const { App } = require('@slack/bolt');
require('dotenv').config()


const app = new App({
    token: process.env.SLACK_BOT_TOKEN, 
    signingSecret: process.env.SLACK_SIGNING_SECRET, 
    appToken: process.env.SLACK_APP_TOKEN, 
    socketMode: true, 
});


app.command('/approval-test', async ({ ack, body, client }) => {
    await ack();

    try {
        await client.views.open({
            trigger_id: body.trigger_id,
            view: {
                type: 'modal',
                callback_id: 'approval_modal',
                title: { type: 'plain_text', text: 'Request Approval' },
                blocks: [
                    {
                        type: 'input',
                        block_id: 'approver_select',
                        label: { type: 'plain_text', text: 'Select Approver' },
                        element: {
                            type: 'users_select',
                            action_id: 'approver',
                        },
                    },
                    {
                        type: 'input',
                        block_id: 'approval_text',
                        label: { type: 'plain_text', text: 'Approval Text' },
                        element: {
                            type: 'plain_text_input',
                            multiline: true,
                            action_id: 'text',
                        },
                    },
                ],
                submit: { type: 'plain_text', text: 'Submit' },
            },
        });
    } catch (error) {
        console.error('Error opening modal:', error);
    }
});

app.view('approval_modal', async ({ ack, body, view, client }) => {
    await ack(); 

    const approver = view.state.values.approver_select.approver.selected_user;
    const approvalText = view.state.values.approval_text.text.value;
    const requester = body.user.id;

    try {
        
        await client.chat.postMessage({
            channel: approver,
            text: `You have a new approval request from <@${requester}>!`,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*Approval Request from <@${requester}>:*\n${approvalText}`,
                    },
                },
                {
                    type: 'actions',
                    elements: [
                        {
                            type: 'button',
                            text: { type: 'plain_text', text: 'Approve' },
                            style: 'primary',
                            action_id: 'approve_request',
                            value: requester, 
                        },
                        {
                            type: 'button',
                            text: { type: 'plain_text', text: 'Reject' },
                            style: 'danger',
                            action_id: 'reject_request',
                            value: requester, 
                        },
                    ],
                },
            ],
        });
    } catch (error) {
        console.error('Error sending message to approver:', error);
    }
});

app.action(/(approve_request|reject_request)/, async ({ ack, body, client, action }) => {
    await ack(); 

    const requester = action.value; 
    const approver = body.user.id;
    const isApproved = action.action_id === 'approve_request';

   
    try {
        await client.chat.postMessage({
            channel: requester,
            text: `Your approval request has been *${isApproved ? 'approved' : 'rejected'}* by <@${approver}>.`,
        });
    } catch (error) {
        console.error('Error notifying requester:', error);
    }
});

(async () => {
    await app.start();
    console.log('Slack app is running in Socket Mode!');
})();






