// importing libraries required
const {google} = require('googleapis');

// body of reply email and the label name to store the emails
const messageText = "Random Reply"
const newLabelName = "Test Label"

// function to fetch new messages, which haven't been replied to by the user yet.
const listNewMessages = async(auth, emailString, email, currentTime) => {

    // fetching all the mails in inbox, starting from after initiation of app.
    const gmail = google.gmail({version: 'v1', auth});
    const res = await gmail.users.threads.list({
        userId: 'me',
        q : `in:inbox after:${currentTime}`
    });
    
    const threads = res.data.threads;
    const newThreads = []

    // if no new email thread are there, return with empty object
    if (!threads || threads.length === 0) {
        console.log('No Threads found.');
        return newThreads;
    }
    console.log('Threads:');

    for(let thread of threads){
        // getting thread response object for every new thread
        const threadRes = await gmail.users.threads.get({
            userId: 'me',
            id: thread.id
        });

        // checkin the number of emails inside the thread
        const messages = threadRes.data.messages

        // if number of messages is 1, it is sent by someone, hence add this to newThread array
        if(messages.length === 1){
            newThreads.push(threadRes)
        }
        // else checking if any of the message is sent by the user
        else {
            let isPush = true
            messages.forEach(message => {
                const headers = message.payload.headers
                headers.forEach(ele => {
                    // if any message in the thread contains from field as the user email id, it means it sent by user, and need not be added to the new Thread array
                    if((ele.name === "From" || ele.name === "from") && (ele.value === emailString || ele.value === email))
                    isPush = false
                })
            })
            // if it does not contain any email from user, push it to the array of new thread
            if(isPush)
            newThreads.push(threadRes)
        }
    }

    // returning array of new Threads, in which user has not replied ever
    return newThreads
}

// function to send reply email
const sendEmail = async(newThreads,auth) => {
    const gmail = google.gmail({version: 'v1', auth});

    newThreads.forEach(async thread => {
        // fetching headers for the thread message, since we have to make reply message acc to the that
        const messageHeaders = thread.data.messages[0].payload.headers
        const messageBody = {}

        // making message body, using to, from and subject field in the message
        messageHeaders.forEach(ele => {
			if (ele.name === "To" || ele.name === "From" || ele.name === "Subject")
			messageBody[ele.name] = ele.value;
		});

        console.log(messageBody)

        // making encoded mail body, which needs to be passed into the send email api
        const encodedMail = makeBody(messageBody.From, messageBody.To, messageBody.Subject, messageText)

        // sending reply email, using encoded email body and the thread id in which reply has to be sent
        const resp = await gmail.users.messages.send({
            userId : "me",
            requestBody : {
                raw : encodedMail,
                threadId : thread.data.id
            }
        })
        console.log(resp.data)

        // after reply, moving to certain label
        await moveToLabel(thread.data.id, auth)
    })
}

// function to move thread to desginated label
const moveToLabel = async(threadId,auth) => {
    let isCreate = true
    let labelId = ""

    // fetching list of all labels present in gmail
    const gmail = google.gmail({version: 'v1', auth});
    const labelRes = await gmail.users.labels.list({
        userId: 'me',
    });
    const labels = labelRes.data.labels

    // checking if our label is already present in gamil
    labels.forEach(label => {
        if(label.name === newLabelName){
            isCreate = false
            labelId = label.id
        }
    })

    // if not present, create a new label with the defined name
    if(isCreate) {
        const newLabelRes = await gmail.users.labels.create({
            userId: "me",
            requestBody: {
              labelListVisibility: "labelShow",
              messageListVisibility: "show",
              name: newLabelName
            }
        })

        // fetching label id of this label, to be sent as paramater while moving thread into this label
        labelId = newLabelRes.data.id
    }

    // moving thread to the desired label, using label id of label (already present or created) and the thread id of thread
    const moveRes = await gmail.users.threads.modify({
        userId: "me",
        id: threadId,
        requestBody: {
          addLabelIds: [labelId]
        }
      })
      console.log(moveRes.status)
}

//gettin email of the current user
const getEmail = async(auth) => {
    // api to get the name and email address of the currenlty logged in user in gmail
    const people = google.people({version : 'v1', auth})
    const res = await people.people.get({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses',
    });

    const fullName = res.data.names[0].displayName
    const email = res.data.emailAddresses[0].value

    // building email string, since sometimes from field in a email is written in this format.
    const emailString = fullName + " <" + email + ">"
    // returning both formats, to check if from field is either of two.
    return [emailString, email]
}

// making email body for reply email
const makeBody = (to, from, subject, message) => {
    var str = ["Content-Type: text/plain; charset=\"UTF-8\"\n",
        "MIME-Version: 1.0\n",
        "Content-Transfer-Encoding: 7bit\n",
        "to: ", to, "\n",
        "from: ", from, "\n",
        "subject: ", subject, "\n\n",
        message
    ].join('');

    // we have to pass email body as encoded base 64 string 
    var encodedMail = Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return encodedMail
}

// final function, which will initiate the process
// first get the emailstring, then list new threads, then send reply in these new thread
const initiateExecution = async(currentTime, auth) => {
    const [emailString, email] = await getEmail(auth)
    const newThreads = await listNewMessages(auth, emailString, email, currentTime)
    sendEmail(newThreads,auth)
}

// exporting function, to be used in route file
module.exports = {
    initiateExecution
}


