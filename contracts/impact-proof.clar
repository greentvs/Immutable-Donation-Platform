(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-PROOF-HASH u101)
(define-constant ERR-INVALID-CAMPAIGN u102)
(define-constant ERR-INVALID-DONATION u103)
(define-constant ERR-PROOF-ALREADY-EXISTS u104)
(define-constant ERR-PROOF-NOT-FOUND u105)
(define-constant ERR-INVALID-TIMESTAMP u106)
(define-constant ERR-INVALID-METADATA u107)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u108)
(define-constant ERR-INVALID-PROOF-TYPE u109)
(define-constant ERR-INVALID-PROOF-STATUS u110)
(define-constant ERR-MAX-PROOFS-EXCEEDED u111)
(define-constant ERR-INVALID-PROOF-ID u112)

(define-data-var next-proof-id uint u0)
(define-data-var max-proofs uint u10000)
(define-data-var authority-contract (optional principal) none)

(define-map proofs
  uint
  {
    proof-hash: (string-ascii 64),
    campaign-id: uint,
    donation-id: uint,
    proof-type: (string-ascii 20),
    metadata: (string-utf8 256),
    timestamp: uint,
    submitter: principal,
    status: bool
  }
)

(define-map proofs-by-hash
  (string-ascii 64)
  uint
)

(define-map proof-verifications
  uint
  {
    verifier: principal,
    verification-timestamp: uint,
    is-valid: bool
  }
)

(define-read-only (get-proof (proof-id uint))
  (map-get? proofs proof-id)
)

(define-read-only (get-proof-by-hash (proof-hash (string-ascii 64)))
  (match (map-get? proofs-by-hash proof-hash)
    proof-id (map-get? proofs proof-id)
    none
  )
)

(define-read-only (get-verification (proof-id uint))
  (map-get? proof-verifications proof-id)
)

(define-read-only (is-proof-registered (proof-hash (string-ascii 64)))
  (is-some (map-get? proofs-by-hash proof-hash))
)

(define-private (validate-proof-hash (proof-hash (string-ascii 64)))
  (if (and (> (len proof-hash) u0) (<= (len proof-hash) u64))
    (ok true)
    (err ERR-INVALID-PROOF-HASH)
  )
)

(define-private (validate-campaign-id (campaign-id uint))
  (if (> campaign-id u0)
    (ok true)
    (err ERR-INVALID-CAMPAIGN)
  )
)

(define-private (validate-donation-id (donation-id uint))
  (if (> donation-id u0)
    (ok true)
    (err ERR-INVALID-DONATION)
  )
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
    (ok true)
    (err ERR-INVALID-TIMESTAMP)
  )
)

(define-private (validate-metadata (metadata (string-utf8 256)))
  (if (<= (len metadata) u256)
    (ok true)
    (err ERR-INVALID-METADATA)
  )
)

(define-private (validate-proof-type (proof-type (string-ascii 20)))
  (if (or (is-eq proof-type "photo") (is-eq proof-type "report") (is-eq proof-type "video"))
    (ok true)
    (err ERR-INVALID-PROOF-TYPE)
  )
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p 'SP000000000000000000002Q6VF78))
    (ok true)
    (err ERR-NOT-AUTHORIZED)
  )
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (submit-proof
  (proof-hash (string-ascii 64))
  (campaign-id uint)
  (donation-id uint)
  (proof-type (string-ascii 20))
  (metadata (string-utf8 256))
)
  (let
    (
      (proof-id (var-get next-proof-id))
      (max-proofs-allowed (var-get max-proofs))
      (authority (var-get authority-contract))
    )
    (asserts! (< proof-id max-proofs-allowed) (err ERR-MAX-PROOFS-EXCEEDED))
    (try! (validate-proof-hash proof-hash))
    (try! (validate-campaign-id campaign-id))
    (try! (validate-donation-id donation-id))
    (try! (validate-proof-type proof-type))
    (try! (validate-metadata metadata))
    (try! (validate-timestamp block-height))
    (asserts! (is-none (map-get? proofs-by-hash proof-hash)) (err ERR-PROOF-ALREADY-EXISTS))
    (asserts! (is-some authority) (err ERR-AUTHORITY-NOT-VERIFIED))
    (map-set proofs proof-id
      {
        proof-hash: proof-hash,
        campaign-id: campaign-id,
        donation-id: donation-id,
        proof-type: proof-type,
        metadata: metadata,
        timestamp: block-height,
        submitter: tx-sender,
        status: true
      }
    )
    (map-set proofs-by-hash proof-hash proof-id)
    (var-set next-proof-id (+ proof-id u1))
    (print { event: "proof-submitted", id: proof-id, hash: proof-hash })
    (ok proof-id)
  )
)

(define-public (verify-proof (proof-id uint) (is-valid bool))
  (let
    (
      (proof (map-get? proofs proof-id))
    )
    (match proof
      p
      (begin
        (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
        (map-set proof-verifications proof-id
          {
            verifier: tx-sender,
            verification-timestamp: block-height,
            is-valid: is-valid
          }
        )
        (map-set proofs proof-id
          {
            proof-hash: (get proof-hash p),
            campaign-id: (get campaign-id p),
            donation-id: (get donation-id p),
            proof-type: (get proof-type p),
            metadata: (get metadata p),
            timestamp: (get timestamp p),
            submitter: (get submitter p),
            status: is-valid
          }
        )
        (print { event: "proof-verified", id: proof-id, valid: is-valid })
        (ok true)
      )
      (err ERR-PROOF-NOT-FOUND)
    )
  )
)

(define-public (get-proof-count)
  (ok (var-get next-proof-id))
)