/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
// admin.initializeApp();

!admin.apps.length ? admin.initializeApp() : admin.app();

try {
  admin.initializeApp();
} catch (e) {}

// Keeps track of the length of the 'likes' child list in a separate property.

exports.likePost = functions.database.ref('/likes/{postid}/{userid}').onWrite(

  async (change, context) => {

    const postid = context.params.postid;
    const collectionRef = change.after.ref.parent;
    const countRef = collectionRef.parent.parent.child('liked/' + postid + '/count');

    let increment;
    if (change.after.exists() && !change.before.exists()) {
      increment = 1;
    } else if (!change.after.exists() && change.before.exists()) {
      increment = -1;
    } else {
      return null;
    }

    // Return the promise from countRef.transaction() so our function
    // waits for this async event to complete before it exits.
    await countRef.transaction((current) => {
      return (current || 0) + increment;
    });
    console.log('Counter updated.');
    return null;

  });


// If the number of likes gets deleted, recount the number of likes
exports.recountlikes = functions.database.ref('/liked/{postid}/count').onDelete(async (snap, context) => {
  const postid = context.params.postid;
  const counterRef = snap.ref;
  const collectionRef = counterRef.parent.parent.parent.child('likes/' + postid);
  // Return the promise from countRef.transaction() so our function
  // waits for this async event to complete before it exits.
  const messagesData = await collectionRef.once('value');
  return await counterRef.set(messagesData.numChildren());

});

