# Security Specification & Test-Driven Development (TDD) for Soda Spottings

This specification details the security invariants and validations enforced for the FizzFinder Firestore collections.

## 1. Data Invariants

- **Authentication required**: Only signed-in users can write (create spottings, add comments, submit new custom flavors).
- **Owner Identity Lock**: The `reportedBy` (or `userId`, `username`) field in newly written records must strictly correspond to the authenticated user's uid or username. Users must not be able to impersonate other users or spoof reputations.
- **Strict Size/Boundary Restrictions**: Strings must be strictly bounded (e.g. description is limited, comment texts <= 500 characters, store names <= 100 characters) to prevent Denial of Wallet resources exhaustion.
- **Immutable Fields**:
  - `createdAt` must be equal to `request.time` upon creation and never modified.
  - `spottedId`, `reportedBy`, and `flavorId` cannot be updated on existing spottings.
- **Relational Consistency**: A comment cannot be created on a non-existent spotting.
- **Action-Based affectedKeys Updates**: Modifications to spottings (like adding an upvote/confirmation or downvote/denial, or changing stock level) must restrict changes *only* to those authorized fields.

---

## 2. The "Dirty Dozen" (12 Vulnerability Payloads)

Here are the 12 malicious / corrupt payload scenarios designed to break system invariants. These must be rejected with `PERMISSION_DENIED`.

### Scenario 1: Identity Spoofing (Spotted By Malicious User)
- **Path**: `/spottings/spot-malicious`
- **Operation**: `create`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Payload**:
```json
{
  "id": "spot-malicious",
  "flavorId": "surge",
  "flavorName": "Surge Original Citrus",
  "brand": "The Coca-Cola Company",
  "category": "Soda",
  "storeName": "Stolen Market",
  "storeAddress": "123 Fake St",
  "latitude": 33.7,
  "longitude": -84.3,
  "stockLevel": "Full Shelf",
  "size": "12 oz Can",
  "reportedBy": "LegitSipMaster", // SPOOFED USERNAME
  "reportedByReputation": 9999, // SPOOFED REPUTATION PRESTIGE
  "confirmations": 0,
  "denials": 0,
  "storeRating": 5.0
}
```
- **Reason for Rejection**: The spotting author's username/reputation doesn't match the caller's auth metadata, or sets an unverified rank configuration.

### Scenario 2: Identity Spoofing in User Profile Creation
- **Path**: `/users/attacker_uid`
- **Operation**: `create`
- **Auth**: `{ uid: "attacker_uid", token: { email_verified: true } }`
- **Payload**:
```json
{
  "userId": "attacker_uid",
  "username": "SuperHacker",
  "reputationPoints": 50000, // Privilege escalation
  "contributionsCount": 50,
  "accuracyRate": 100,
  "badge": "Sip Master", // Claiming premium rank directly
  "avatarColor": "from-red-500"
}
```
- **Reason for Rejection**: Users cannot initialize or elevate their reputation or badge level beyond base values (`reputationPoints: 0` or similar start state) during self-service register.

### Scenario 3: Anonymous User Attempting Writes
- **Path**: `/spottings/spot-anon`
- **Operation**: `create`
- **Auth**: `null` (or unverified/anonymous)
- **Payload**: Same as valid spotting.
- **Reason for Rejection**: Must be verified and signed in.

### Scenario 4: Path Poisoning (Injecting Massive Junk Character IDs)
- **Path**: `/spottings/VERY_LONG_INVALID_ID_THAT_EXCEEDS_128_CHARACTERS_AND_HAS_SPECIAL_CHARACTERS_$$$!!!_TO_CRASH_INDEXERS_AND_EXHAUST_STORAGE_QUOTA`
- **Operation**: `create`
- **Auth**: `{ uid: "user123", token: { email_verified: true } }`
- **Payload**: Valid spotting schema with matched ID.
- **Reason for Rejection**: Fails `isValidId()` check on document path variable.

### Scenario 5: Denial of Wallet via Giant String Injection
- **Path**: `/spottings/spot-bloat`
- **Operation**: `create`
- **Auth**: `{ uid: "user123", token: { email_verified: true } }`
- **Payload**:
```json
{
  "id": "spot-bloat",
  "flavorId": "surge",
  "flavorName": "Surge Original Citrus",
  "brand": "The Coca-Cola Company",
  "category": "Soda",
  "storeName": "Store with 10MB Character Name...[repeating]...",
  "storeAddress": "123 Street",
  "latitude": 33.7,
  "longitude": -84.3,
  "stockLevel": "Full Shelf",
  "size": "Huge",
  "reportedBy": "User123",
  "reportedByReputation": 0,
  "confirmations": 0,
  "denials": 0,
  "storeRating": 4.5
}
```
- **Reason for Rejection**: Fails length limiters on text fields inside static metadata schema rules.

### Scenario 6: Ghost Field / Shadow Update Insertion
- **Path**: `/spottings/spot-1`
- **Operation**: `update`
- **Auth**: `{ uid: "user123", token: { email_verified: true } }`
- **Payload**:
```json
{
  "stockLevel": "Medium",
  "isDeletableByAll": true, // SHADOW GHOST FIELD
  "updatedAt": "request.time"
}
```
- **Reason for Rejection**: The `affectedKeys()` gate on updates blocks any fields not explicitly on the action allowlist.

### Scenario 7: State Shortcutting - Artificially Inflating Vote Confirmations
- **Path**: `/spottings/spot-1`
- **Operation**: `update`
- **Auth**: `{ uid: "voter123", token: { email_verified: true } }`
- **Payload**:
```json
{
  "confirmations": 1500, // Jump from 12 to 1500
  "updatedAt": "request.time"
}
```
- **Reason for Rejection**: Upvoting must increment confirmations by exactly `1` or follow strict action invariants.

### Scenario 8: Mutating Immutable Creation Timestamp
- **Path**: `/spottings/spot-1`
- **Operation**: `update`
- **Auth**: `{ uid: "user123", token: { email_verified: true } }`
- **Payload**:
```json
{
  "createdAt": "2000-01-01T00:00:00Z" // Trying to rewrite history
}
```
- **Reason for Rejection**: `createdAt` is immutable.

### Scenario 9: Creating a Comment on a Non-Existent Spotting
- **Path**: `/spottings/NON_EXISTENT_SPOTTING_ID/comments/comm-1`
- **Operation**: `create`
- **Auth**: `{ uid: "user123", token: { email_verified: true } }`
- **Payload**:
```json
{
  "id": "comm-1",
  "username": "user123",
  "userReputation": 100,
  "text": "Great find!",
  "time": "Just now"
}
```
- **Reason for Rejection**: Master Gate validation fetches the parent document `/spottings/NON_EXISTENT_SPOTTING_ID` using `get()`, which will fail because the parent does not exist.

### Scenario 10: Unauthorized Modification on Other User's Spotting
- **Path**: `/spottings/spot-created-by-someone-else`
- **Operation**: `update`
- **Auth**: `{ uid: "hacker123", token: { email_verified: true } }`
- **Payload**:
```json
{
  "storeName": "Hacked Name"
}
```
- **Reason for Rejection**: Users can only update non-voting details on their *own* spottings.

### Scenario 11: Setting Rating Outside [1, 5] Boundary
- **Path**: `/spottings/spot-1`
- **Operation**: `create`
- **Auth**: `{ uid: "user123", token: { email_verified: true } }`
- **Payload**:
```json
{
  "storeRating": 99.9 // Outside bounds
}
```
- **Reason for Rejection**: `isValidSpotting` requires `storeRating >= 1 && storeRating <= 5`.

### Scenario 12: Email Spoofing (Unverified Admin Claim)
- **Path**: `/users/admin-bypass`
- **Operation**: `create`
- **Auth**: `{ uid: "spoof-uid", token: { email: "jsteph1967@gmail.com", email_verified: false } }`
- **Payload**: Sets admin stats directly.
- **Reason for Rejection**: Requires `token.email_verified == true`.

---

## 3. Test Runner Specification

The Security Rules compiler checks that `firestore.rules` passes ESLint rules, and rejects all non-compliant queries. Our frontend client implements rigorous `handleFirestoreError` mappings to report validation and security rejects concisely.
