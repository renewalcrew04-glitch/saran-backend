import AWS from 'aws-sdk';

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const sns = new AWS.SNS();

export const sendPush = async (endpointArn, payload) => {
  if (!endpointArn) return;

  const message = {
    default: payload.title,
    GCM: JSON.stringify({
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    }),
  };

  await sns.publish({
    MessageStructure: 'json',
    Message: JSON.stringify(message),
    TargetArn: endpointArn,
  }).promise();
};
