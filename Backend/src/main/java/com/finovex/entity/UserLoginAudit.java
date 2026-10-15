package com.finovex.entity;

import java.util.Date;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.finovex.enums.LoginEvent;
import com.finovex.enums.LoginResult;

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

/**
 * One sign-in attempt, refresh or sign-out. Rows are written once and never changed, so there is
 * no status column; createdDate is when it happened.
 */
@Entity
@Table(name = "user_login_audit")
@EntityListeners(AuditingEntityListener.class)
public class UserLoginAudit {
    private Integer userLoginAuditSeq;
    private Integer userSeq;
    private String username;
    private LoginEvent event;
    private LoginResult result;
    private String sessionId;
    private String ipAddress;
    private String userAgent;
    private String createdBy;
    private Date createdDate;
    private String lastModifiedBy;
    private Date lastModifiedDate;

    private User user;


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "G1")
    @SequenceGenerator(name = "G1", sequenceName = "user_login_audit_seq", allocationSize = 1)
    @Column(name = "user_login_audit_seq", unique = true)
    public Integer getUserLoginAuditSeq() {
        return userLoginAuditSeq;
    }

    public void setUserLoginAuditSeq(Integer userLoginAuditSeq) {
        this.userLoginAuditSeq = userLoginAuditSeq;
    }

    /** Empty when the username didn't match an account. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_seq")
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    @Basic
    @Column(name = "user_seq", insertable = false, updatable = false)
    public Integer getUserSeq() {
        return userSeq;
    }

    public void setUserSeq(Integer userSeq) {
        this.userSeq = userSeq;
    }

    /** The username as entered (lowercased), kept even when it matches no account. */
    @Basic
    @Column(name = "username", length = 100)
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    @Basic
    @Enumerated(EnumType.STRING)
    @Column(name = "event", length = 20, nullable = false)
    public LoginEvent getEvent() {
        return event;
    }

    public void setEvent(LoginEvent event) {
        this.event = event;
    }

    @Basic
    @Enumerated(EnumType.STRING)
    @Column(name = "result", length = 30, nullable = false)
    public LoginResult getResult() {
        return result;
    }

    public void setResult(LoginResult result) {
        this.result = result;
    }

    /** The sign-in session (refresh_token.session_id), when there is one. */
    @Basic
    @Column(name = "session_id", length = 36)
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
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
}
