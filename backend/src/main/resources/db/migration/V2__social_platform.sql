CREATE TABLE practitioner_posts (
    id BIGSERIAL PRIMARY KEY,
    practitioner_profile_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    topic VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_practitioner FOREIGN KEY (practitioner_profile_id) REFERENCES practitioner_profiles(id)
);

CREATE TABLE practitioner_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_user_id BIGINT NOT NULL,
    practitioner_profile_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_follow_follower FOREIGN KEY (follower_user_id) REFERENCES users(id),
    CONSTRAINT fk_follow_practitioner FOREIGN KEY (practitioner_profile_id) REFERENCES practitioner_profiles(id),
    CONSTRAINT uq_follow UNIQUE (follower_user_id, practitioner_profile_id)
);