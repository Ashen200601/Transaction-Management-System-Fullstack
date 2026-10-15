package com.finovex.entity;

import java.util.Date;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.finovex.enums.MasterDataStatus;
import com.finovex.enums.SessionEndReason;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/**
 * One refresh token. Tokens of the same sign-in share a sessionId; each refresh uses up the
 * current token (usedDate) and adds the next one. status is APPROVED while the token can still
 * be used, OPEN once it's used or its session has ended.
 */
@Entity
@Table(name = "refresh_token")
@EntityListeners(AuditingEntityListener.class)
public class RefreshToken {
    private Integer refreshTokenSeq;
    private Integer userSeq;
    private String tokenHash;
    private String sessionId;
    private Date expiresDate;
    private Date usedDate;
    private Date revokedDate;
    private SessionEndReason revokedReason;
    private String ipAddress;
    private String userAgent;
    private Integer status;
    private String statusDescription;
    private String createdBy;
    private Date createdDate;
    private String lastModifiedBy;
    private Date lastModifiedDate;

    private User user;


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "G1")
    @SequenceGenerator(name = "G1", sequenceName = "refresh_token_seq", allocationSize = 1)
    @Column(name = "refresh_token_seq", unique = true)
    public Integer getRefreshTokenSeq() {
        return refreshTokenSeq;
    }

    public void setRefreshTokenSeq(Integer refreshTokenSeq) {
        this.refreshTokenSeq = refreshTokenSeq;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_seq", nullable = false)
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Basic
    @Column(name = "user_seq", insertable = false, updatable = false, nullable = false)
    public Integer getUserSeq() {
        return userSeq;
    }

    public void setUserSeq(Integer userSeq) {
        this.userSeq = userSeq;
    }

    /** SHA-256 of the token, hex. The token itself is only ever in the user's cookie. */
    @Basic
    @Column(name = "token_hash", length = 64, nullable = false, unique = true)
    public String getTokenHash() {
        return tokenHash;
    }

    public void setTokenHash(String tokenHash) {
        this.tokenHash = tokenHash;
    }

    /** Shared by every token of one sign-in. */
    @Basic
    @Column(name = "session_id", length = 36, nullable = false)
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    /** When the session ends, whatever the activity: sign-in time plus the session length. */
    @Basic
    @Column(name = "expires_date", nullable = false)
    public Date getExpiresDate() {
        return expiresDate;
    }

    public void setExpiresDate(Date expiresDate) {
        this.expiresDate = expiresDate;
    }

    /** When this token was exchanged for the next one. */
    @Basic
    @Column(name = "used_date")
    public Date getUsedDate() {
        return usedDate;
    }

    public void setUsedDate(Date usedDate) {
        this.usedDate = usedDate;
    }

    @Basic
    @Column(name = "revoked_date")
    public Date getRevokedDate() {
        return revokedDate;
    }

    public void setRevokedDate(Date revokedDate) {
        this.revokedDate = revokedDate;
    }

    @Basic
    @Enumerated(EnumType.STRING)
    @Column(name = "revoked_reason", length = 30)
    public SessionEndReason getRevokedReason() {
        return revokedReason;
    }

    public void setRevokedReason(SessionEndReason revokedReason) {
        this.revokedReason = revokedReason;
    }

    @Basic
    @Column(name = "ip_address", length = 45)
    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    @Basic
    @Column(name = "user_agent", length = 500)
    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    @Basic
    @Column(name = "status", nullable = true)
    public Integer getStatus() {
        return status;
    }

    public void setStatus(Integer status) {
        this.status = status;
        if (status != null) {
            this.setStatusDescription(MasterDataStatus.findOne(status).getStatus());
        }
    }

    @Basic
    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    @Basic
    @CreatedDate
    @Column(name = "created_date", nullable = false, updatable = false)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    public Date getCreatedDate() {
        return createdDate;
    }

    public void setCreatedDate(Date createdDate) {
        this.createdDate = createdDate;
    }

    @Basic
    @LastModifiedBy
    @Column(name = "last_modified_by")
    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    @Basic
    @LastModifiedDate
    @Column(name = "last_modified_date", nullable = true)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd HH:mm")
    public Date getLastModifiedDate() {
        return lastModifiedDate;
    }

    public void setLastModifiedDate(Date lastModifiedDate) {
        this.lastModifiedDate = lastModifiedDate;
    }

    @Transient
    public String getStatusDescription() {
        return statusDescription;
    }

    public void setStatusDescription(String statusDescription) {
        this.statusDescription = statusDescription;
    }
}
