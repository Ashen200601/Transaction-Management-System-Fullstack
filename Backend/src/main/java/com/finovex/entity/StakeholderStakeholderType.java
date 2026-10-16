package com.finovex.entity;

import java.util.Date;

import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.finovex.enums.MasterDataStatus;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/** Which types a stakeholder has: one row per stakeholder per type (the many-to-many link). */
@Entity
@Table(name = "stakeholder_stakeholder_type")
@EntityListeners(AuditingEntityListener.class)
public class StakeholderStakeholderType {
    private Integer stakeholderStakeholderTypeSeq;
    private Integer stakeholderSeq;
    private Integer stakeholderTypeSeq;
    private Integer status;
    private String statusDescription;
    private String createdBy;
    private Date createdDate;
    private String lastModifiedBy;
    private Date lastModifiedDate;

    private Stakeholder stakeholder;
    private StakeholderType stakeholderType;


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "G1")
    @SequenceGenerator(name = "G1", sequenceName = "stakeholder_stakeholder_type_seq", allocationSize = 1)
    @Column(name = "stakeholder_stakeholder_type_seq", unique = true)
    public Integer getStakeholderStakeholderTypeSeq() {
        return stakeholderStakeholderTypeSeq;
    }

    public void setStakeholderStakeholderTypeSeq(Integer stakeholderStakeholderTypeSeq) {
        this.stakeholderStakeholderTypeSeq = stakeholderStakeholderTypeSeq;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stakeholder_seq", nullable = false)
    public Stakeholder getStakeholder() {
        return stakeholder;
    }

    public void setStakeholder(Stakeholder stakeholder) {
        this.stakeholder = stakeholder;
    }

    @Basic
    @Column(name = "stakeholder_seq", insertable = false, updatable = false, nullable = false)
    public Integer getStakeholderSeq() {
        return stakeholderSeq;
    }

    public void setStakeholderSeq(Integer stakeholderSeq) {
        this.stakeholderSeq = stakeholderSeq;
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stakeholder_type_seq", nullable = false)
    public StakeholderType getStakeholderType() {
        return stakeholderType;
    }

    public void setStakeholderType(StakeholderType stakeholderType) {
        this.stakeholderType = stakeholderType;
    }

    @Basic
    @Column(name = "stakeholder_type_seq", insertable = false, updatable = false, nullable = false)
    public Integer getStakeholderTypeSeq() {
        return stakeholderTypeSeq;
    }

    public void setStakeholderTypeSeq(Integer stakeholderTypeSeq) {
        this.stakeholderTypeSeq = stakeholderTypeSeq;
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
